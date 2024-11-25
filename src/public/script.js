document.addEventListener("DOMContentLoaded", () => {
  const appContainer = document.getElementById("app");
  const popup = document.getElementById("popup");

  let accountName = localStorage.getItem("accountName");

  // Initialize the app based on local storage
  if (accountName) {
    showQRCode(accountName);
  } else {
    showAccountNameForm();
  }

  // Display the account name form
  function showAccountNameForm() {
    appContainer.innerHTML = `
        <h1>Welcome to 2Auth-JS</h1>
        <h2>Set Up Two-Factor Authentication</h2>
        <form id="accountForm">
          <label for="accountName">Enter your account name:</label>
          <input type="text" id="accountName" name="accountName" required />
          <button type="submit">Generate QR Code</button>
        </form>
      `;

    const accountForm = document.getElementById("accountForm");
    accountForm.addEventListener("submit", handleAccountSubmit);
  }

  // Handle account form submission
  function handleAccountSubmit(event) {
    event.preventDefault();
    accountName = document.getElementById("accountName").value.trim();
    if (accountName) {
      localStorage.setItem("accountName", accountName);
      showQRCode(accountName);
    }
  }

  // Display the QR code and OTP input
  function showQRCode(accountName) {
    fetch("/set-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch QR code");
        return response.json();
      })
      .then((data) => {
        appContainer.innerHTML = `
            <h1>Hello, ${accountName}</h1>
            <h2>Scan the QR Code Below</h2>
            <div class="qr-code">
              <img src="${data.imageUrl}" alt="QR Code" />
            </div>
            <div class="otp-container">
              ${Array(6)
                .fill('<input type="number" maxlength="1" class="otp-input" />')
                .join("")}
            </div>
            <button id="newKeyBtn">Create a New Key</button>
          `;

        document
          .getElementById("newKeyBtn")
          .addEventListener("click", resetAccount);

        setupOTPInputs();
      })
      .catch((error) => showPopup("Error: " + error.message, "error"));
  }

  // Set up OTP input behaviors
  function setupOTPInputs() {
    const inputs = document.querySelectorAll(".otp-input");
    inputs.forEach((input, index) => {
      input.addEventListener("input", (e) => handleInput(e, inputs, index));
      input.addEventListener("keydown", (e) =>
        handleBackspace(e, inputs, index)
      );
    });
  }

  // Handle OTP input
  function handleInput(event, inputs, index) {
    const input = event.target;
    const nextInput = inputs[index + 1];

    if (input.value.length > 0 && nextInput) {
      nextInput.focus();
    }

    const otpValue = Array.from(inputs)
      .map((i) => i.value)
      .join("");
    if (otpValue.length === inputs.length) {
      verifyOTP(otpValue, inputs);
    }
  }

  // Handle backspace in OTP input
  function handleBackspace(event, inputs, index) {
    if (event.key === "Backspace" && !inputs[index].value && index > 0) {
      inputs[index - 1].focus();
    }
  }

  // Verify OTP
  function verifyOTP(token, inputs) {
    fetch("/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to verify OTP");
        return response.json();
      })
      .then((data) => {
        if (data.isValid) {
          showPopup("Success! The OTP is valid.", "success");
          updateInputsState(inputs, "success");
        } else {
          showPopup("Failure! The OTP is invalid. Please try again.", "error");
          updateInputsState(inputs, "error");
        }
      })
      .catch((error) => showPopup("Error: " + error.message, "error"));
  }

  // Update the state of OTP inputs
  function updateInputsState(inputs, state) {
    inputs.forEach((input) => {
      input.classList.remove("success", "error");
      input.classList.add(state);
    });
  }

  // Display a popup with a message
  function showPopup(message, type) {
    popup.innerHTML = `
        <div class="icon ${type}">
          ${type === "success" ? "✔" : "✖"} <!-- Success or Error icon -->
        </div>
        <p>${message}</p>
        <button id="popupClose">Close</button>
    `;
    popup.classList.remove("hidden"); // Make the popup visible

    // Add event listener to close button
    document.getElementById("popupClose").addEventListener("click", () => {
      popup.classList.add("hidden"); // Hide popup on close
    });
  }

  // Reset account and clear local storage
  function resetAccount() {
    localStorage.removeItem("accountName");
    accountName = null;
    showAccountNameForm();
  }
});
