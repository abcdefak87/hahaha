/**
 * usePagination Hook
 * Manages pagination state and logic
 */

import { useState, useCallback, useMemo } from 'react';

interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  totalItems?: number;
}

interface PaginationState {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

interface PaginationActions {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  reset: () => void;
}

export function usePagination(options: PaginationOptions = {}): [PaginationState, PaginationActions] {
  const {
    initialPage = 1,
    initialLimit = 10,
    totalItems: initialTotalItems = 0
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / limit) || 1;
  }, [totalItems, limit]);

  const hasNextPage = useMemo(() => {
    return page < totalPages;
  }, [page, totalPages]);

  const hasPrevPage = useMemo(() => {
    return page > 1;
  }, [page]);

  const startIndex = useMemo(() => {
    return (page - 1) * limit;
  }, [page, limit]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + limit - 1, totalItems - 1);
  }, [startIndex, limit, totalItems]);

  const handleSetPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const handleSetLimit = useCallback((newLimit: number) => {
    if (newLimit > 0) {
      setLimit(newLimit);
      // Reset to first page when limit changes
      setPage(1);
    }
  }, []);

  const handleSetTotalItems = useCallback((total: number) => {
    setTotalItems(Math.max(0, total));
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
    setTotalItems(initialTotalItems);
  }, [initialPage, initialLimit, initialTotalItems]);

  const state: PaginationState = {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex
  };

  const actions: PaginationActions = {
    setPage: handleSetPage,
    setLimit: handleSetLimit,
    setTotalItems: handleSetTotalItems,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset
  };

  return [state, actions];
}

export default usePagination;
