function generatePagination(currentPage, totalPages, loadFunction) {
    const pagination = document.getElementById('pagination');
    let paginationHTML = '';

    if (currentPage > 1) {
        paginationHTML += `<a href="#" onclick="${loadFunction}(${currentPage - 1})">« Предыдущая</a>`;
    }

    if (currentPage > 3) {
        paginationHTML += `<a href="#" onclick="${loadFunction}(1)">Первая</a>`;
    }

    for (let page = 1; page <= totalPages; page++) {
        if (page <= 3 || page >= totalPages - 2 || (page >= currentPage - 2 && page <= currentPage + 2)) {
            paginationHTML += `<a href="#" class="${page === currentPage ? 'active' : ''}" onclick="${loadFunction}(${page})">${page}</a>`;
        } else if (page === currentPage - 3 || page === currentPage + 3) {
            paginationHTML += `<span class="dots">...</span>`;
        }
    }

    if (currentPage < totalPages - 2) {
        paginationHTML += `<a href="#" onclick="${loadFunction}(${totalPages})">Последняя</a>`;
    }

    if (currentPage < totalPages) {
        paginationHTML += `<a href="#" onclick="${loadFunction}(${currentPage + 1})">Следующая »</a>`;
    }
    pagination.innerHTML = paginationHTML;
}