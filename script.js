
const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");
const historyList = document.getElementById("historyList");

let expression = "";
let answer = 0;
let memory = 0;
let isRadians = false;
let justCalculated = false;

let history = JSON.parse(localStorage.getItem("novaHistory") || "[]");

function formatResult(value) {
    if (typeof value === "function" || value === undefined) {
        return "Error";
    }

    if (typeof value === "number") {
        if (!Number.isFinite(value)) return "Error";
        if (Object.is(value, -0)) return "0";

        return Number(value.toPrecision(12)).toLocaleString("en-US", {
            maximumFractionDigits: 12,
            useGrouping: false
        });
    }

    return String(value);
}

function evaluateExpression(input) {
    const scope = {
        Ans: answer,

        sin: x => Math.sin(isRadians ? x : x * Math.PI / 180),
        cos: x => Math.cos(isRadians ? x : x * Math.PI / 180),
        tan: x => {
            const angle = isRadians ? x : x * Math.PI / 180;
            if (Math.abs(Math.cos(angle)) < 1e-12) {
                throw new Error("Undefined");
            }
            return Math.tan(angle);
        },

        sqrt: Math.sqrt,
        log: Math.log10,
        ln: Math.log,
        abs: Math.abs,
        pi: Math.PI,
        e: Math.E
    };

    return math.evaluate(
        input
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/π/g, "pi"),
        scope
    );
}

function updateDisplay() {
    expressionDisplay.textContent = expression;

    if (!expression) {
        resultDisplay.textContent = "0";
        return;
    }

    try {
        const result = evaluateExpression(expression);
        resultDisplay.textContent = formatResult(result);
    } catch {
        resultDisplay.textContent = " ";
    }
}

function addValue(value) {
    if (justCalculated) {
        if (/^[0-9.]$/.test(value)) {
            expression = "";
        }
        justCalculated = false;
    }

    expression += value;
    updateDisplay();
}

function clearCalculator() {
    expression = "";
    justCalculated = false;
    updateDisplay();
}

function deleteLast() {
    if (justCalculated) {
        clearCalculator();
        return;
    }

    const functions = ["sqrt(", "sin(", "cos(", "tan(", "log(", "ln(", "abs("];

    const found = functions.find(fn => expression.endsWith(fn));

    if (found) {
        expression = expression.slice(0, -found.length);
    } else {
        expression = expression.slice(0, -1);
    }

    updateDisplay();
}

function calculate() {
    if (!expression.trim()) return;

    try {
        const originalExpression = expression;
        const result = evaluateExpression(expression);

        if (typeof result !== "number" || !Number.isFinite(result)) {
            throw new Error("Invalid result");
        }

        answer = result;

        const formatted = formatResult(result);

        history.unshift({
            expression: originalExpression,
            result: formatted
        });

        history = history.slice(0, 50);

        localStorage.setItem("novaHistory", JSON.stringify(history));

        expressionDisplay.textContent = originalExpression + " =";
        resultDisplay.textContent = formatted;

        expression = String(result);
        justCalculated = true;

        renderHistory();

    } catch (error) {
        resultDisplay.textContent = "Invalid Input";
        justCalculated = false;
    }
}

// Scientific mode

document.getElementById("degBtn").addEventListener("click", () => {
    isRadians = false;
    document.getElementById("degBtn").classList.add("active");
    document.getElementById("radBtn").classList.remove("active");
    document.getElementById("mode").textContent = "DEG";
    updateDisplay();
});

document.getElementById("radBtn").addEventListener("click", () => {
    isRadians = true;
    document.getElementById("radBtn").classList.add("active");
    document.getElementById("degBtn").classList.remove("active");
    document.getElementById("mode").textContent = "RAD";
    updateDisplay();
});

// Memory functions

function getCurrentValue() {
    if (!expression) return answer;

    const value = evaluateExpression(expression);

    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error("Invalid value");
    }

    return value;
}

function updateMemoryIndicator() {
    document.getElementById("memoryIndicator").textContent =
        memory !== 0 ? "M" : "";
}

function memoryAction(action) {
    try {
        switch (action) {
            case "mc":
                memory = 0;
                break;

            case "mr":
                addValue(String(memory));
                break;

            case "mplus":
                memory += getCurrentValue();
                break;

            case "mminus":
                memory -= getCurrentValue();
                break;
        }

        updateMemoryIndicator();

    } catch {
        resultDisplay.textContent = "Invalid Memory Value";
    }
}

// Sign change

function toggleSign() {
    if (!expression) return;

    if (justCalculated) {
        expression = `-(${expression})`;
        justCalculated = false;
    } else {
        expression = `-(${expression})`;
    }

    updateDisplay();
}

// Button interactions

document.querySelectorAll(".key").forEach(button => {
    button.addEventListener("click", () => {
        const value = button.dataset.value;
        const action = button.dataset.action;

        if (action === "clear") clearCalculator();
        else if (action === "delete") deleteLast();
        else if (action === "calculate") calculate();
        else if (action === "sign") toggleSign();
        else if (action?.startsWith("m")) memoryAction(action);
        else if (value) addValue(value);
    });
});

// Keyboard support

document.addEventListener("keydown", event => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        addValue(key);
    } else if (key === "+") {
        addValue("+");
    } else if (key === "-") {
        addValue("-");
    } else if (key === "*") {
        addValue("×");
    } else if (key === "/") {
        event.preventDefault();
        addValue("÷");
    } else if (key === "(" || key === ")") {
        addValue(key);
    } else if (key === "^") {
        addValue("^");
    } else if (key === "%") {
        addValue("%");
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape") {
        clearCalculator();
    }
});

// History

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <span>◷</span>
                <p>No calculations yet</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = "";

    history.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";

        const exp = document.createElement("div");
        exp.className = "history-expression";
        exp.textContent = item.expression;

        const res = document.createElement("div");
        res.className = "history-result";
        res.textContent = "= " + item.result;

        div.append(exp, res);

        div.addEventListener("click", () => {
            expression = item.expression;
            justCalculated = false;
            updateDisplay();
        });

        historyList.appendChild(div);
    });
}

document.getElementById("clearHistory").addEventListener("click", () => {
    history = [];
    localStorage.removeItem("novaHistory");
    renderHistory();
});

// History panel

document.getElementById("historyToggle").addEventListener("click", () => {
    document.getElementById("historyPanel").classList.toggle("show");
});

// Theme switching

document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light");

    const isLight = document.body.classList.contains("light");

    document.getElementById("themeToggle").textContent =
        isLight ? "☾" : "☼";

    localStorage.setItem("novaTheme", isLight ? "light" : "dark");
});

// Restore theme

if (localStorage.getItem("novaTheme") === "light") {
    document.body.classList.add("light");
    document.getElementById("themeToggle").textContent = "☾";
}

// Initialize

renderHistory();
updateMemoryIndicator();
updateDisplay();
