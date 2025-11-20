const translations = {
    en: {
        title: "Welcome Back",
        subtitle: "Please enter your details to login.",
        identifier: "Username, Email, or Phone",
        password: "Password",
        forgot: "Forgot password?",
        loginBtn: "Login",
        noAccount: "Don't have an account?",
        signup: "Sign up"
    },
    es: {
        title: "Bienvenido de nuevo",
        subtitle: "Ingrese sus datos para iniciar sesión.",
        identifier: "Usuario, correo o teléfono",
        password: "Contraseña",
        forgot: "¿Olvidaste tu contraseña?",
        loginBtn: "Iniciar sesión",
        noAccount: "¿No tienes una cuenta?",
        signup: "Regístrate"
    },
    fr: {
        title: "Bon retour",
        subtitle: "Veuillez entrer vos informations pour vous connecter.",
        identifier: "Nom, Email ou Téléphone",
        password: "Mot de passe",
        forgot: "Mot de passe oublié ?",
        loginBtn: "Connexion",
        noAccount: "Vous n'avez pas de compte ?",
        signup: "S'inscrire"
    }
};

document.getElementById("language").addEventListener("change", function () {
    const lang = this.value;
    document.getElementById("title").innerText = translations[lang].title;
    document.getElementById("subtitle").innerText = translations[lang].subtitle;
    document.getElementById("label-identifier").innerText = translations[lang].identifier;
    document.getElementById("label-password").innerText = translations[lang].password;
    document.getElementById("forgot").innerText = translations[lang].forgot;
    document.getElementById("loginBtn").innerText = translations[lang].loginBtn;
    document.getElementById("no-account").innerText = translations[lang].noAccount;
    document.getElementById("signupLink").innerText = translations[lang].signup;
});
