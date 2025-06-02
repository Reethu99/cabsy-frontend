document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion Functionality
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            this.classList.toggle('active');
            const answer = this.nextElementSibling;
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
            } else {
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // Scroll to section when category item is clicked
    document.querySelectorAll('.category-item h3 a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });

            // Optionally, expand the FAQ item if it's clicked from a category link
            const targetId = this.getAttribute('href').substring(1);
            const targetFaqItem = document.getElementById(targetId);
            if (targetFaqItem) {
                const questionButton = targetFaqItem.querySelector('.faq-question');
                const answerDiv = targetFaqItem.querySelector('.faq-answer');

                if (!questionButton.classList.contains('active')) {
                    questionButton.classList.add('active');
                    answerDiv.style.maxHeight = answerDiv.scrollHeight + "px";
                }
            }
        });
    });
});