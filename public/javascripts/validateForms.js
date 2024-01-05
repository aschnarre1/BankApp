// Immediately Invoked Function Expression (IIFE) to enable strict mode and encapsulate the code
(function () {
    'use strict'

    // Select all forms with the 'validated-form' class
    const forms = document.querySelectorAll('.validated-form')

    // Convert the NodeList of forms into an array and iterate over each form
    //and add a event listener and check to see if the form is vallid. Prevents form from 
    //submitting if it is not valid
    Array.from(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }

                form.classList.add('was-validated')
            }, false)
        })
})()