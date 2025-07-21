export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    }
}
export const calculatePagination = (page : number, limit:number , totalItems: number ) => {
     const totalPages = Math.ceil(totalItems / limit);
     const hasNextPage = page < totalPages;
     const hasPreviousPage = page >1;

 return {
    currentPage : page,
    totalPages,
    totalItems,
    itemsPerPage : limit,
    hasNextPage,
    hasPreviousPage
 }
}

export const getSkipValue = (page: number , limit : number) : number => {
    return (page -1) * limit;
};

