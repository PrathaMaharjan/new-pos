// Lightweight API client compatible with Axios-like calls (api.get, api.post, api.patch, api.delete)

export interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  response: {
    status: number;
    data: any;
  };

  constructor(status: number, data: any) {
    super(typeof data?.error === 'string' ? data.error : 'API Request Failed');
    this.name = 'ApiError';
    this.response = { status, data };
  }
}

// In-memory mock staff storage for frontend testing until backend endpoints are ready
let mockStaff = [
  {
    userId: "staff-1",
    name: "Aarav Sharma",
    role: "Cashier",
    email: "aarav.sharma@test.com",
    phone: "9841234567",
    isActive: true,
    outletId: "loc-1",
    outletName: "Main Branch",
  },
  {
    userId: "staff-2",
    name: "Sunita Thapa",
    role: "Waiter",
    email: "sunita.thapa@test.com",
    phone: "9812345678",
    isActive: true,
    outletId: "loc-2",
    outletName: "Downtown Outlet",
  },
  {
    userId: "staff-3",
    name: "Bikash Adhikari",
    role: "Kitchen Crew",
    email: "bikash.adhikari@test.com",
    phone: "9801234569",
    isActive: false,
    outletId: "loc-1",
    outletName: "Main Branch",
  },
  {
    userId: "staff-4",
    name: "Pooja Gurung",
    role: "Cashier",
    email: "pooja.gurung@test.com",
    phone: "9865432100",
    isActive: true,
    outletId: "loc-3",
    outletName: "Westside Branch",
  },
];

let mockLocations = [
  {
    id: "loc-1",
    name: "Main Branch",
    address: "Ward 4, Durbar Marg",
    city: "Kathmandu",
    state: "Bagmati",
    country: "Nepal",
    postalCode: "44600",
    phone: "+977 1-4221100",
    isActive: true,
  },
  {
    id: "loc-2",
    name: "Downtown Outlet",
    address: "Lakeside Street 6",
    city: "Pokhara",
    state: "Gandaki",
    country: "Nepal",
    postalCode: "33700",
    phone: "+977 61-523400",
    isActive: true,
  },
  {
    id: "loc-3",
    name: "Westside Branch",
    address: "Siddhartha Highway",
    city: "Butwal",
    state: "Lumbini",
    country: "Nepal",
    postalCode: "32907",
    phone: "+977 71-540123",
    isActive: false,
  },
];

async function request<T = any>(
  endpoint: string,
  method: string,
  body?: any,
  config?: RequestConfig
): Promise<{ data: T }> {
  const url = new URL(
    endpoint.startsWith('http')
      ? endpoint
      : `${endpoint.startsWith('/') ? '' : '/'}${endpoint.startsWith('api/') || endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`}`,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );

  if (config?.params) {
    Object.entries(config.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.append(k, String(v));
      }
    });
  }

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers ?? {}),
      },
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Fallback mock handling for /staff and /locations if backend is not implemented yet
      if ((res.status === 404 || res.status === 502) && endpoint.includes('/staff')) {
        return handleStaffMock<T>(method, endpoint, body, config?.params);
      }
      if ((res.status === 404 || res.status === 502) && (endpoint.includes('/locations') || endpoint.includes('/auth/locations'))) {
        return handleLocationMock<T>(method, endpoint, body);
      }
      throw new ApiError(res.status, data);
    }

    return { data };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;

    // If network / 404 error, use mock handler so frontend works smoothly
    if (endpoint.includes('/staff')) {
      return handleStaffMock<T>(method, endpoint, body, config?.params);
    }
    if (endpoint.includes('/locations') || endpoint.includes('/auth/locations')) {
      return handleLocationMock<T>(method, endpoint, body);
    }

    throw new ApiError(500, { error: err?.message || 'Network error' });
  }
}

function handleLocationMock<T>(method: string, endpoint: string, body?: any): { data: T } {
  if (method === 'GET') {
    return { data: { locations: mockLocations } as unknown as T };
  }
  if (method === 'POST') {
    const newLoc = {
      id: `loc-${Date.now()}`,
      name: body.name,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || null,
      postalCode: body.postalCode || null,
      phone: body.phone || null,
      isActive: true,
    };
    mockLocations.unshift(newLoc);
    return { data: { location: newLoc } as unknown as T };
  }
  if (method === 'PATCH') {
    const id = endpoint.split('/').pop();
    const idx = mockLocations.findIndex((l) => l.id === id);
    if (idx !== -1) {
      mockLocations[idx] = { ...mockLocations[idx], ...body };
      return { data: { location: mockLocations[idx] } as unknown as T };
    }
  }
  return { data: {} as unknown as T };
}

function handleStaffMock<T>(
  method: string,
  endpoint: string,
  body?: any,
  params?: Record<string, any>
): { data: T } {
  if (method === 'GET') {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 8;
    const start = (page - 1) * limit;
    const pagedStaff = mockStaff.slice(start, start + limit);
    return {
      data: {
        staff: pagedStaff,
        pagination: {
          total: mockStaff.length,
          totalPages: Math.ceil(mockStaff.length / limit) || 1,
          currentPage: page,
        },
      } as unknown as T,
    };
  }

  if (method === 'POST') {
    const newMember = {
      userId: `staff-${Date.now()}`,
      name: body.name,
      role: body.role,
      email: body.email,
      phone: body.phone || null,
      isActive: true,
      outletId: body.outletId || "loc-1",
      outletName: body.outletName || "Main Branch",
    };
    mockStaff.unshift(newMember);
    return { data: newMember as unknown as T };
  }

  if (method === 'PATCH') {
    const parts = endpoint.split('/');
    const idIndex = parts.indexOf('staff') + 1;
    const userId = parts[idIndex];

    const idx = mockStaff.findIndex((s) => s.userId === userId);
    if (idx !== -1) {
      if (endpoint.endsWith('/status')) {
        mockStaff[idx].isActive = body.isActive;
      } else if (endpoint.endsWith('/info')) {
        mockStaff[idx] = { ...mockStaff[idx], ...body };
      } else {
        mockStaff[idx] = { ...mockStaff[idx], ...body };
      }
      return { data: mockStaff[idx] as unknown as T };
    }
  }

  if (method === 'DELETE') {
    const parts = endpoint.split('/');
    const userId = parts[parts.indexOf('staff') + 1];
    mockStaff = mockStaff.filter((s) => s.userId !== userId);
    return { data: { success: true } as unknown as T };
  }

  return { data: {} as unknown as T };
}

export const api = {
  get: <T = any>(url: string, config?: RequestConfig) => request<T>(url, 'GET', undefined, config),
  post: <T = any>(url: string, body?: any, config?: RequestConfig) => request<T>(url, 'POST', body, config),
  patch: <T = any>(url: string, body?: any, config?: RequestConfig) => request<T>(url, 'PATCH', body, config),
  put: <T = any>(url: string, body?: any, config?: RequestConfig) => request<T>(url, 'PUT', body, config),
  delete: <T = any>(url: string, config?: RequestConfig) => request<T>(url, 'DELETE', undefined, config),
};

export default api;
