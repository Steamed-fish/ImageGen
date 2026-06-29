import { beforeEach, describe, expect, it, vi } from "vitest";

const user = {
  id: "7fd61c8b-3256-4824-a72c-c54f26bb84e9",
  email: "alex@example.com"
};

const getUser = vi.fn();
const from = vi.fn();
const storageFrom = vi.fn();
const createSignedUrl = vi.fn();

type HistoryJob = {
  id: string;
  image_type: string;
  subject: string;
  compiled_prompt: string;
  storage_path: string | null;
  created_at: string;
  completed_at: string | null;
};

type HistoryQueryDependencies = {
  jobs?: HistoryJob[];
  queryError?: unknown;
};

function createHistoryJob(overrides: Partial<HistoryJob> = {}): HistoryJob {
  return {
    id: "job-1",
    image_type: "poster",
    subject: "a coffee brand launch poster",
    compiled_prompt: "Create a poster about a coffee brand launch poster.",
    storage_path: `${user.id}/job-1.png`,
    created_at: "2026-06-29T08:00:00.000Z",
    completed_at: "2026-06-29T08:00:10.000Z",
    ...overrides
  };
}

function historyQueryMock({
  jobs = [createHistoryJob()],
  queryError = null
}: HistoryQueryDependencies = {}) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn().mockResolvedValue({
      data: jobs,
      error: queryError
    })
  };

  return query;
}

async function importRoute(dependencies: HistoryQueryDependencies = {}) {
  vi.resetModules();
  vi.clearAllMocks();

  const query = historyQueryMock(dependencies);

  getUser.mockResolvedValue({ data: { user }, error: null });
  from.mockImplementation((table: string) => {
    if (table !== "generation_jobs") {
      throw new Error(`Unexpected table: ${table}`);
    }

    return query;
  });
  storageFrom.mockImplementation((bucket: string) => {
    if (bucket !== "generated-images") {
      throw new Error(`Unexpected bucket: ${bucket}`);
    }

    return { createSignedUrl };
  });
  createSignedUrl.mockImplementation((path: string) =>
    Promise.resolve({
      data: { signedUrl: `https://example.com/signed/${path}` },
      error: null
    })
  );

  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: vi.fn(() => ({
      auth: { getUser }
    }))
  }));
  vi.doMock("@/lib/supabase/admin", () => ({
    createSupabaseAdminClient: vi.fn(() => ({
      from,
      storage: {
        from: storageFrom
      }
    }))
  }));

  return {
    route: await import("@/app/api/history/route"),
    query
  };
}

describe("GET /api/history", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    const { route } = await importRoute();
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const response = await route.GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({
      code: "UNAUTHENTICATED"
    });
    expect(from).not.toHaveBeenCalled();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("lists completed jobs for the authenticated user newest first with signed URLs", async () => {
    const jobs = [
      createHistoryJob({ id: "newer-job", storage_path: `${user.id}/newer-job.png` }),
      createHistoryJob({
        id: "older-job",
        storage_path: `${user.id}/older-job.png`,
        created_at: "2026-06-28T08:00:00.000Z"
      })
    ];
    const { route, query } = await importRoute({ jobs });

    const response = await route.GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("generation_jobs");
    expect(query.select).toHaveBeenCalledWith(
      "id, image_type, subject, compiled_prompt, storage_path, created_at, completed_at"
    );
    expect(query.eq).toHaveBeenCalledWith("user_id", user.id);
    expect(query.eq).toHaveBeenCalledWith("status", "completed");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(storageFrom).toHaveBeenCalledWith("generated-images");
    expect(createSignedUrl).toHaveBeenNthCalledWith(
      1,
      `${user.id}/newer-job.png`,
      60 * 60
    );
    expect(createSignedUrl).toHaveBeenNthCalledWith(
      2,
      `${user.id}/older-job.png`,
      60 * 60
    );
    expect(payload).toEqual({
      items: [
        {
          ...jobs[0],
          imageUrl: `https://example.com/signed/${user.id}/newer-job.png`
        },
        {
          ...jobs[1],
          imageUrl: `https://example.com/signed/${user.id}/older-job.png`
        }
      ]
    });
  });

  it("returns 500 when the history query fails", async () => {
    const { route } = await importRoute({
      queryError: new Error("database unavailable")
    });

    const response = await route.GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toMatchObject({
      code: "HISTORY_FAILED"
    });
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("keeps items when signing fails or the storage path is missing", async () => {
    const jobs = [
      createHistoryJob({ id: "unsigned-job", storage_path: `${user.id}/unsigned-job.png` }),
      createHistoryJob({ id: "missing-path-job", storage_path: null })
    ];
    const { route } = await importRoute({ jobs });
    createSignedUrl.mockRejectedValueOnce(new Error("storage unavailable"));

    const response = await route.GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    expect(payload.items).toEqual([
      {
        ...jobs[0],
        imageUrl: null
      },
      {
        ...jobs[1],
        imageUrl: null
      }
    ]);
  });
});
