export interface DashboardSession {
  session: {
    id: string;
    userId: string;
  };
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role?: string | null;
  };
}

export type GetDashboardSession = (input: {
  headers: HeadersInit;
}) => Promise<DashboardSession | null>;

export class DashboardAuthError extends Error {
  constructor(message = "Dashboard authentication required") {
    super(message);
    this.name = new.target.name;
  }
}

export class DashboardAuthorizationError extends Error {
  constructor(message = "Dashboard owner or admin access required") {
    super(message);
    this.name = new.target.name;
  }
}
