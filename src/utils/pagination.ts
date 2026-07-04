import type { Request } from "express";

export function buildPagination(query: Request["query"], allowedSortColumns = ["id"]) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? "20"), 10) || 20));
  const offset = (page - 1) * limit;
  const requestedSort = String(query.sort ?? allowedSortColumns[0]);
  const sort = allowedSortColumns.includes(requestedSort) ? requestedSort : allowedSortColumns[0];
  const order = String(query.order ?? "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  return { page, limit, offset, sort, order };
}

export function buildPaginationMeta(page: number, limit: number, totalCount: number) {
  return {
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    hasNextPage: page * limit < totalCount,
    hasPrevPage: page > 1,
  };
}
