output 'instance_public_ip' {
  description = 'Public IP of the Sitesync VM'
  value       = oci_core_public_ip.sitesync_ip.ip_address
}

output 'instance_ocid' {
  description = 'OCID of the provisioned compute instance'
  value       = oci_core_instance.sitesync_vm.id
}

output 'domain_name' {
  description = 'DNS domain name for the application'
  value       = oci_dns_zone.sitesync_zone.name
}

output 'network_security_group_id' {
  description = 'OCID of the network security group'
  value       = oci_core_network_security_group.sitesync_nsg.id
}

output 'backup_policy_id' {
  description = 'OCID of the volume backup policy'
  value       = oci_core_volume_backup_policy.sitesync_backup.id
}
