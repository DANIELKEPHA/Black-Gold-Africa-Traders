module.exports = {
    apps: [
        {
            name: "black-gold-app",
            script: "npm",
            args: "run dev",
            env: {
                NODE_ENV: "development",
            },
        },
    ],
};
