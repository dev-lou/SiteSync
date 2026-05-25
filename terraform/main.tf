terraform {
  required_version = '>= 1.10'
  required_providers {
    oci = {
      source  = 'oracle/oci'
      version = '>= 6.21'
    }
  }

  # Remote state backend — OCI Object Storage bucket
  backend 'http' {
  }
}

# Backend config is passed via `terraform init -backend-config=backend.hcl`
# backend.hcl example:
#   address       = "https://objectstorage.us-ashburn-1.oraclecloud.com/p/..."
#   lock_address  = "https://objectstorage.us-ashburn-1.oraclecloud.com/p/..."
#   unlock_address = "https://objectstorage.us-ashburn-1.oraclecloud.com/p/..."
#   lock_method   = "PUT"
#   unlock_method = "DELETE"
#   username      = "..."  # or use OCI resource principal

provider 'oci' {
  region = var.region
}

# ── Data Sources ──

data 'oci_identity_availability_domains' 'ads' {
  compartment_id = var.compartment_ocid
}

data 'oci_core_images' 'ubuntu' {
  compartment_id           = var.compartment_ocid
  operating_system         = 'Canonical Ubuntu'
  operating_system_version = '24.04'
  shape                    = 'VM.Standard.A1.Flex'
  sort_by                  = 'TIMECREATED'
  sort_order               = 'DESC'
}

# ── Networking ──

resource 'oci_core_vcn' 'sitesync_vcn' {
  compartment_id = var.compartment_ocid
  display_name   = 'sitesync-vcn'
  cidr_blocks    = ['10.0.0.0/16']
  dns_label      = 'sitesync'
}

resource 'oci_core_subnet' 'sitesync_subnet' {
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.sitesync_vcn.id
  display_name      = 'sitesync-subnet'
  cidr_block        = '10.0.1.0/24'
  dns_label         = 'sitesync'
  security_list_ids = [oci_core_security_list.sitesync_sl.id]
}

# Network Security Group (recommended over Security List for granularity)
resource 'oci_core_network_security_group' 'sitesync_nsg' {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.sitesync_vcn.id
  display_name   = 'sitesync-nsg'
}

resource 'oci_core_network_security_group_security_rule' 'sitesync_nsg_ssh' {
  network_security_group_id = oci_core_network_security_group.sitesync_nsg.id
  direction                 = 'INGRESS'
  protocol                  = '6'
  source                    = '0.0.0.0/0'
  source_type               = 'CIDR_BLOCK'
  tcp_options {
    destination_port_range {
      min = 22
      max = 22
    }
  }
  description = 'SSH access'
}

resource 'oci_core_network_security_group_security_rule' 'sitesync_nsg_http' {
  network_security_group_id = oci_core_network_security_group.sitesync_nsg.id
  direction                 = 'INGRESS'
  protocol                  = '6'
  source                    = '0.0.0.0/0'
  source_type               = 'CIDR_BLOCK'
  tcp_options {
    destination_port_range {
      min = 80
      max = 80
    }
  }
  description = 'HTTP access'
}

resource 'oci_core_network_security_group_security_rule' 'sitesync_nsg_https' {
  network_security_group_id = oci_core_network_security_group.sitesync_nsg.id
  direction                 = 'INGRESS'
  protocol                  = '6'
  source                    = '0.0.0.0/0'
  source_type               = 'CIDR_BLOCK'
  tcp_options {
    destination_port_range {
      min = 443
      max = 443
    }
  }
  description = 'HTTPS access'
}

resource 'oci_core_network_security_group_security_rule' 'sitesync_nsg_egress' {
  network_security_group_id = oci_core_network_security_group.sitesync_nsg.id
  direction                 = 'EGRESS'
  protocol                  = 'all'
  destination               = '0.0.0.0/0'
  destination_type          = 'CIDR_BLOCK'
  description               = 'All outbound traffic'
}

# Security List (keep for backward compatibility)
resource 'oci_core_security_list' 'sitesync_sl' {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.sitesync_vcn.id
  display_name   = 'sitesync-security-list'

  egress_security_rules {
    destination = '0.0.0.0/0'
    protocol    = 'all'
  }

  ingress_security_rules {
    protocol = '6'
    source   = '0.0.0.0/0'
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol = '6'
    source   = '0.0.0.0/0'
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = '6'
    source   = '0.0.0.0/0'
    tcp_options {
      min = 443
      max = 443
    }
  }
}

# ── Compute ──

resource 'oci_core_instance' 'sitesync_vm' {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = 'sitesync-prod'
  shape               = 'VM.Standard.A1.Flex'

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  source_details {
    source_type = 'image'
    source_id   = data.oci_core_images.ubuntu.images[0].id
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(templatefile('${path.module}/cloud-init.yaml', {
      github_repo = var.github_repo
    }))
  }

  preserve_boot_volume = false
}

# ── Block Volume Backup ──

resource 'oci_core_volume_backup_policy' 'sitesync_backup' {
  compartment_id = var.compartment_ocid
  display_name   = 'sitesync-daily-backup'
  schedules {
    backup_type       = 'INCREMENTAL'
    period            = 'ONE_DAY'
    retention_seconds = 2592000 # 30 days
  }
}

# Boot volume ID lookup for backup policy assignment
data 'oci_core_boot_volumes' 'instance_boot_volume' {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  instance_id         = oci_core_instance.sitesync_vm.id
}

resource 'oci_core_volume_backup_policy_assignment' 'sitesync_backup_assign' {
  asset_id  = data.oci_core_boot_volumes.instance_boot_volume.boot_volumes[0].id
  policy_id = oci_core_volume_backup_policy.sitesync_backup.id
}

# ── Public IP ──

resource 'oci_core_public_ip' 'sitesync_ip' {
  compartment_id    = var.compartment_ocid
  display_name      = 'sitesync-public-ip'
  lifetime          = 'RESERVED'
  assigned_entity_id = oci_core_instance.sitesync_vm.id
}

# ── DNS (OCI DNS Zone) ──

resource 'oci_dns_zone' 'sitesync_zone' {
  compartment_id = var.compartment_ocid
  name           = var.domain_name
  zone_type      = 'PRIMARY'
}

resource 'oci_dns_rrset' 'sitesync_a_record' {
  compartment_id = var.compartment_ocid
  zone_name_or_id = oci_dns_zone.sitesync_zone.id
  domain         = var.domain_name
  rtype          = 'A'
  items {
    domain = var.domain_name
    rdata  = oci_core_public_ip.sitesync_ip.ip_address
    rtype  = 'A'
    ttl    = 300
  }
}
