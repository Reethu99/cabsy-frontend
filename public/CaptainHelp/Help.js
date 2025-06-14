document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion Functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    const logoutButton = document.getElementById("logout-btn");
    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success) {
                alert('Logged out successfully!');
                window.location.href = data.redirectUrl; // Redirect to homepage
            } else {
                alert('Logout failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred during logout.');
        }
    });
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