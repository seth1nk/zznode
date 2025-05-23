document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'header-container';
    headerContainer.innerHTML = `
        <a class="pets-link" href="/repairs/index.html">Ремонты</a>
        <a class="pets-link" href="/">Главная</a>
        <a class="nutrition-link" href="/clients/index.html">Клиенты</a>
    `;
    document.body.insertBefore(headerContainer, document.body.firstChild);
});