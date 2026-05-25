/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Locals {
    auth: () => Promise<{
      user: { id: string; name: string; email: string; role: string; image?: string; projectId?: string }
    } | null>;
    user?: { id: string; name: string; email: string; role: string; image?: string; projectId?: string };
  }

  interface PageData {
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      avatarUrl?: string;
      projectId?: string;
    };
  }

  interface Error {
    message: string;
    code?: string;
  }
}
