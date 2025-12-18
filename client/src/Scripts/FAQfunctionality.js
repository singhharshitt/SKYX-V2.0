           document.addEventListener('DOMContentLoaded', function () {
                const faqItems = document.querySelectorAll('.faq-item');

                faqItems.forEach(item => {
                    const question = item.querySelector('.faq-question');
                    const answer = item.querySelector('.faq-answer');
                    const icon = item.querySelector('.faq-icon');

                    question.addEventListener('click', () => {
                        const isOpen = question.getAttribute('aria-expanded') === 'true';

                        // Close all other items (optional: comment out for multiple open)
                        faqItems.forEach(otherItem => {
                            if (otherItem !== item) {
                                const otherQuestion = otherItem.querySelector('.faq-question');
                                const otherAnswer = otherItem.querySelector('.faq-answer');
                                const otherIcon = otherItem.querySelector('.faq-icon');

                                otherQuestion.setAttribute('aria-expanded', 'false');
                                otherAnswer.style.maxHeight = '0px';
                                otherIcon.style.transform = 'rotate(0deg)';
                            }
                        });

                        // Toggle current item
                        if (isOpen) {
                            question.setAttribute('aria-expanded', 'false');
                            answer.style.maxHeight = '0px';
                            icon.style.transform = 'rotate(0deg)';
                        } else {
                            question.setAttribute('aria-expanded', 'true');
                            answer.style.maxHeight = answer.scrollHeight + 'px';
                            icon.style.transform = 'rotate(180deg)';
                        }
                    });

                    // Keyboard accessibility
                    question.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            question.click();
                        }
                    });
                });
            });