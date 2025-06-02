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


let selectedOptionId = null;

document.querySelectorAll('.toggle-option').forEach(option => {
  option.addEventListener('click', () => {
    selectedOptionId = option.id;

    document.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
  });
});


document.getElementById("loginForm").addEventListener("submit", async function (e) {
    
e.preventDefault(); // Prevent form from refreshing the page

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    console.log('Username:', username);
    console.log('Password:', password);

    console.log('Selected ID:', selectedOptionId);
    
    if (selectedOptionId === 'option1') {
        window.location.href = '/riderhome';
    } else if (selectedOptionId === 'option2') {
        window.location.href = '/captain';
    } else {
        alert("Please select an option.");
    }
    // Determine selected role
    const role = document.getElementById("option1").classList.contains("active") ? "rider" : "captain";

    // try {
    //     const response = await fetch("https://your-api-endpoint.com/login", {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({ username, password, role }),
    //     });

    //     const data = await response.json();

    //     if (response.ok) {
    //         // Handle successful login
    //         alert("Login successful!");
    //         // Redirect or store token
    //         // window.location.href = "/dashboard";
    //     } else {
    //         // Handle login error
    //         alert(data.message || "Login failed. Please try again.");
    //     }
    // } catch (error) {
    //     console.error("Error during login:", error);
    //     alert("An error occurred. Please try again later.");
    // }
});

