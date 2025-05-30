document.addEventListener('DOMContentLoaded', () => {
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    const highlightLine = document.getElementById('highlight-line');
 
    option1.addEventListener('click', () => {
        option1.classList.add('selected');
        option2.classList.remove('selected');
        highlightLine.style.left = '0';
    });
 
    option2.addEventListener('click', () => {
        option2.classList.add('selected');
        option1.classList.remove('selected');
        highlightLine.style.left = '120px';
    });
});