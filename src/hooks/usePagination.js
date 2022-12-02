import { useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

export const PARAM_PAGE_KEY = 'page';
export const RESULTS_COUNT_KEY = 'results';

export const usePaginationLink = (
  paginationParamPageKey,
  paginationResultCountKey
) => {
  const { pathname, search } = useLocation();
  const keyForPage = paginationParamPageKey || PARAM_PAGE_KEY;
  const keyForPageSize = paginationResultCountKey || RESULTS_COUNT_KEY;

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const generatePaginationLink = useCallback(
    (page, count) => {
      if (page < 1 || count < 0) {
        return '#';
      }

      const sp = Object.fromEntries(searchParams.entries());

      const newSp = new URLSearchParams({
        ...sp,
      });

      if (page) {
        newSp.set(keyForPage, page);
      }
      if (count) {
        newSp.set(keyForPageSize, count);
      }

      return `${pathname}?${newSp.toString()}`;
    },
    [searchParams]
  );

  return { generatePaginationLink };
};

const usePagination = (
  perPage = 10,
  paginationParamPageKey = PARAM_PAGE_KEY,
  paginationResultCountKey = RESULTS_COUNT_KEY
) => {
  const { search } = useLocation();
  const { push } = useHistory();

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const keyForPage = paginationParamPageKey || PARAM_PAGE_KEY;
  const keyForPageSize = paginationResultCountKey || RESULTS_COUNT_KEY;

  const page = +(searchParams.get(keyForPage) || 1);
  const pageSize = +(searchParams.get(keyForPageSize) || perPage);

  const onPageChange = useCallback(
    (newPage) => {
      const sp = Object.fromEntries(searchParams.entries());
      const newParams = {
        ...sp,
        [keyForPage]: newPage,
      };
      push({
        search: new URLSearchParams(newParams).toString(),
      });
    },
    [searchParams]
  );

  const onPageSizeChange = useCallback(
    (newPageSize) => {
      const sp = Object.fromEntries(searchParams.entries());
      const params = {
        ...sp,
        [keyForPageSize]: newPageSize,
        [keyForPage]: 1, // reset de toute manière la page quand on change le page size
      };
      push({
        search: new URLSearchParams(params).toString(),
      });
    },
    [searchParams]
  );
  return { page, pageSize, onPageChange, onPageSizeChange };
};

export default usePagination;
