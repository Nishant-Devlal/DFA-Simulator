let dfa = null;
let simulationSteps = [];
let currentStep = 0;
let isPlaying = false;
let playTimer = null;

function createDFA() {
    const states = document
        .getElementById("states")
        .value
        .split(",")
        .map(s => s.trim())
        .filter(s => s !== "");

    const alphabet = document
        .getElementById("alphabet")
        .value
        .split(",")
        .map(s => s.trim())
        .filter(s => s !== "");

    const startState = document.getElementById("startState").value.trim();

    const finalStates = document
        .getElementById("finalStates")
        .value
        .split(",")
        .map(s => s.trim())
        .filter(s => s !== "");

    const transitionText = document.getElementById("transitions").value;

    const transitions = {};

    const lines = transitionText
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "");

    for (const line of lines) {
        const parts = line.split(",").map(x => x.trim());
        if (parts.length !== 3) {
            continue;
        }
        const [from, symbol, to] = parts;
        if (!transitions[from]) {
            transitions[from] = {};
        }
        transitions[from][symbol] = to;
    }

    return {
        states,
        alphabet,
        startState,
        finalStates,
        transitions
    };
}

function validateDFA(dfa) {
    if (dfa.states.length === 0) {
        return "No states were provided.";
    }

    if (dfa.alphabet.length === 0) {
        return "No alphabet symbols were provided.";
    }

    if (!dfa.states.includes(dfa.startState)) {
        return "Start state does not exist.";
    }

    for (const state of dfa.finalStates) {
        if (!dfa.states.includes(state)) {
            return `Final state ${state} does not exist.`;
        }
    }

    for (const from of Object.keys(dfa.transitions)) {
        if (!dfa.states.includes(from)) {
            return `Transition contains unknown state ${from}.`;
        }

        for (const symbol of Object.keys(dfa.transitions[from])) {
            const to = dfa.transitions[from][symbol];
            if (!dfa.alphabet.includes(symbol)) {
                return `Symbol ${symbol} is not in the alphabet.`;
            }
            if (!dfa.states.includes(to)) {
                return `Destination state ${to} does not exist.`;
            }
        }
    }

    // Check that every state has a transition
    // for every alphabet symbol.
    for (const state of dfa.states) {
        for (const symbol of dfa.alphabet) {
            if (
                !dfa.transitions[state] ||
                !dfa.transitions[state][symbol]
            ) {
                return `Missing transition: δ(${state}, ${symbol})`;
            }
        }
    }

    return null;
}

function simulateDFA(dfa, input) {
    let currentState = dfa.startState;
    const steps = [];

    // Store the starting state
    steps.push({
        step: 0,
        symbol: "-",
        currentState: currentState,
        nextState: currentState
    });

    // Process every symbol
    for (let i = 0; i < input.length; i++) {
        const symbol = input[i];
        // Check if symbol belongs to alphabet
        if (!dfa.alphabet.includes(symbol)) {
            return {
                error: `Symbol '${symbol}' is not in the DFA alphabet.`
            };
        }

        // Find next state
        const nextState = dfa.transitions[currentState][symbol];

        // Store this step
        steps.push({
            step: i + 1,
            symbol: symbol,
            currentState: currentState,
            nextState: nextState
        });

        // Move to next state
        currentState = nextState;
    }

    // Check whether final state is accepting
    const accepted = dfa.finalStates.includes(currentState);

    return {
        error: null,
        accepted: accepted,
        finalState: currentState,
        steps: steps
    };
}

function displaySteps(steps) {
    const table = document.getElementById("stepsTable");
    table.innerHTML = "";
    for (const step of steps) {
        const row = document.createElement("tr");
        let transition = "Start";
        if (step.symbol !== "-") {
            transition = `δ(${step.currentState}, ${step.symbol}) = ${step.nextState}`;
        }
        row.innerHTML = `
            <td>${step.step}</td>
            <td>${step.symbol}</td>
            <td>${step.currentState}</td>
            <td>${transition}</td>
            <td>${step.nextState}</td>
        `;
        table.appendChild(row);
    }
}

function createArrowMarker(svg) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");

    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");

    const polygon = document.createElementNS("http://www.w3.org/2000/svg","polygon");
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", "#333");

    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);
}

function calculateStatePositions(states) {
    const positions = {};
    const startX = 150;
    const spacing = 180;
    const y = 250;
    states.forEach((state, index) => {
        positions[state] = {
            x: startX + index * spacing,
            y: y
        };
    });
    return positions;
}

function drawState(svg, state, position, isFinal) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", position.x);
    circle.setAttribute("cy", position.y);
    circle.setAttribute("r", 40);
    circle.setAttribute("data-state", state);
    circle.setAttribute("class", isFinal ? "dfa-final-state" : "dfa-state");
    group.appendChild(circle);

    // Second circle for final state
    if (isFinal) {
        const innerCircle = document.createElementNS("http://www.w3.org/2000/svg",  "circle");
        innerCircle.setAttribute("cx", position.x);
        innerCircle.setAttribute("cy", position.y);
        innerCircle.setAttribute("r", 33);
        innerCircle.setAttribute("class", "dfa-final-state");
        group.appendChild(innerCircle);
    }

    // State name
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

    text.setAttribute("x", position.x);
    text.setAttribute("y", position.y);
    text.setAttribute("class", "dfa-state-label");
    text.textContent = state;
    group.appendChild(text);
    svg.appendChild(group);
}

function drawStartArrow(svg, position) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", position.x - 90);
    line.setAttribute("y1", position.y);
    line.setAttribute("x2", position.x - 42);
    line.setAttribute("y2", position.y);
    line.setAttribute("class", "dfa-start-arrow");
    line.setAttribute("marker-end", "url(#arrowhead)");
    svg.appendChild(line);
}

function drawSelfLoop(svg, state, position, label) {
    const path =document.createElementNS("http://www.w3.org/2000/svg", "path");
    const x = position.x;
    const y = position.y;
    const d = `
        M ${x - 25} ${y - 30}
        C ${x - 80} ${y - 100},
          ${x + 80} ${y - 100},
          ${x + 25} ${y - 30}
    `;

    path.setAttribute("d", d);
    path.setAttribute("class", "dfa-arrow");

    // Used later for transition highlighting
    path.setAttribute("data-from", state);
    path.setAttribute("data-to", state);
    path.setAttribute("data-symbol", label);
    path.setAttribute("marker-end", "url(#arrowhead)");
    svg.appendChild(path);

    // Label
    const text =document.createElementNS("http://www.w3.org/2000/svg","text");
    text.setAttribute("x", x);
    text.setAttribute("y", y - 85);
    text.setAttribute("class", "dfa-transition-label");
    text.textContent = label;
    svg.appendChild(text);
}

function drawTransition(svg, from,to, fromPosition, toPosition, label) {
    const line =document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("data-from", from);
    line.setAttribute("data-to", to);
    line.setAttribute("data-symbol", label);
    line.setAttribute("x1", fromPosition.x + 40);
    line.setAttribute("y1", fromPosition.y);
    line.setAttribute("x2", toPosition.x - 40);
    line.setAttribute("y2", toPosition.y);
    line.setAttribute("class", "dfa-arrow");
    line.setAttribute("marker-end", "url(#arrowhead)");
    svg.appendChild(line);

    // Label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const midX = (fromPosition.x + toPosition.x) / 2;
    const midY = (fromPosition.y + toPosition.y) / 2 - 10;
    text.setAttribute("x", midX);
    text.setAttribute("y", midY);
    text.setAttribute("class", "dfa-transition-label");
    text.textContent = label;
    svg.appendChild(text);
}

function visualizeDFA(dfa) {
    console.log("visualizeDFA called");
    console.log("DFA:", dfa);
    const svg = document.getElementById("dfaSvg");
    console.log("SVG:", svg);

    // Remove previous diagram
    svg.innerHTML = "";

    // Create arrowhead
    createArrowMarker(svg);

    // Calculate positions
    const positions = calculateStatePositions(dfa.states);

    // Draw transitions first
    for (const from of dfa.states) {
        if (!dfa.transitions[from]) {
            continue;
        }

        for (const symbol of dfa.alphabet) {
            const to = dfa.transitions[from][symbol];
            if (!to) {
                continue;
            }

            // Self-loop
            if (from === to) {
                drawSelfLoop(svg, from, positions[from], symbol);
            }

            // Normal transition
            else {
                drawTransition(svg, from, to, positions[from], positions[to], symbol);
            }
        }
    }

    // Draw states
    for (const state of dfa.states) {
        const isFinal = dfa.finalStates.includes(state);
        drawState(svg, state, positions[state], isFinal);
    }

    // Draw start arrow
    drawStartArrow(svg, positions[dfa.startState]);
}

function highlightState(state) {
    // Remove previous highlights
    const states = document.querySelectorAll( "#dfaSvg [data-state]");
    states.forEach(element => {
        element.classList.remove("active-state");
    });

    // Find current state
    const currentState =document.querySelector(`#dfaSvg [data-state="${state}"]`);

    if (currentState) {
        currentState.classList.add("active-state");
    }
}

function highlightTransition(from, to, symbol) {
    // Remove previous transition highlights
    const transitions =document.querySelectorAll("#dfaSvg [data-from]");

    transitions.forEach(transition => {
        transition.classList.remove("active-transition");
    });

    // Find matching transition
    transitions.forEach(transition => {
        const transitionFrom = transition.getAttribute("data-from");
        const transitionTo = transition.getAttribute("data-to");
        const transitionSymbol = transition.getAttribute("data-symbol");

        console.log("Checking:", transitionFrom, transitionSymbol, transitionTo);

        if (transitionFrom === from && transitionTo === to && transitionSymbol === symbol) {
            console.log("MATCH FOUND!");
            transition.classList.add("active-transition");
        }
    });
}

function highlightFinalState(state) {
    const finalState = document.querySelector(`#dfaSvg [data-state="${state}"]`);
    if (finalState) {
        finalState.classList.add("accepting-state");
    }
}

function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= simulationSteps.length) {
        return;
    }

    const step = simulationSteps[stepIndex];
    currentStep = stepIndex;

    // Highlight current state
    highlightState(step.currentState);

    // Highlight current transition
    if (step.symbol !== "-") {
        highlightTransition(step.currentState, step.nextState, step.symbol);
    } 
    else {
        // Step 0 has no transition
        const transitions =document.querySelectorAll( "#dfaSvg [data-from]");
        transitions.forEach(transition => {
            transition.classList.remove("active-transition");
        });
    }

    // Highlight current table row
    highlightTableRow(stepIndex);

    // Final state highlighting
    if (stepIndex === simulationSteps.length - 1 && dfa.finalStates.includes(step.currentState)) {
        highlightFinalState(step.currentState);
    }
}

function highlightTableRow(stepIndex) {
    const rows = document.querySelectorAll("#stepsTable tr");
    rows.forEach(row => {
        row.classList.remove("active-row");
    });

    if (rows[stepIndex]) {
        rows[stepIndex].classList.add("active-row");
    }
}

function clearHighlights() {
    // Clear state highlights
    const states = document.querySelectorAll("#dfaSvg [data-state]");
    states.forEach(state => {
        state.classList.remove("active-state");
        state.classList.remove("accepting-state");
    });

    // Clear transition highlights
    const transitions = document.querySelectorAll("#dfaSvg [data-from]");
    transitions.forEach(transition => {
        transition.classList.remove("active-transition");
    });

    // Clear table row highlights
    const rows = document.querySelectorAll("#stepsTable tr");

    rows.forEach(row => {
        row.classList.remove("active-row");
    });
}

document
    .getElementById("buildBtn")
    .addEventListener("click", () => {
        dfa = createDFA();
        const error = validateDFA(dfa);
        const message = document.getElementById("validationMessage");
        if (error) {
            message.textContent = "❌ " + error;
            return;
        }
        message.textContent = "✅ DFA is valid and ready for simulation.";
        visualizeDFA(dfa);  // Draw DFA
    });

document
    .getElementById("runBtn")
    .addEventListener("click", () => {
        if (!dfa) {   // Make sure DFA exists
            document.getElementById("result").textContent = "❌ Please build a valid DFA first.";
            return;
        }

        // Get input string
        const input = document.getElementById("inputString").value.trim();

        // Check empty input
        if (input.length === 0) {
            document.getElementById("result").textContent = "❌ Please enter an input string.";
            return;
        }

        const result = simulateDFA(dfa, input);      // Run DFA

        // Check simulation error
        if (result.error) {
            document.getElementById("result").textContent = "❌ " + result.error;
            document.getElementById("stepsTable").innerHTML = "";
            return;
        }

        // Save Simulation
        simulationSteps = result.steps;
        currentStep = 0;
        isPlaying = false;

        displaySteps(result.steps);   // Display steps

        // Display final result
        const resultElement = document.getElementById("result");

        if (result.accepted) {
            resultElement.innerHTML = `
                <div> ✔️ STRING ACCEPTED </div>
                <div> Final State: ${result.finalState} </div>
            `;
        } 
        else {
            resultElement.innerHTML = `
                <div> ✖️ STRING REJECTED </div>
                <div> Final State: ${result.finalState} </div>
            `;
        }
    });

document
    .getElementById("nextBtn")
    .addEventListener("click", () => {
        if (simulationSteps.length === 0) {
            return;
        }
        if (currentStep < simulationSteps.length - 1) {
            currentStep++;
            showStep(currentStep);
        }
    });

document
    .getElementById("resetBtn")
    .addEventListener("click", () => {
        isPlaying = false;      // Stop playback
        clearInterval(playTimer);
        playTimer = null;
        currentStep = 0;       // Reset simulation position
        clearHighlights();     // Remove all visual highlights
        console.log("Simulation reset");
    });

document
    .getElementById("playBtn")
    .addEventListener("click", () => {
        if (simulationSteps.length === 0) {
            return;
        }
        if (isPlaying) {
            return;
        }
        isPlaying = true;
        playTimer = setInterval(() => {
            if (currentStep >= simulationSteps.length - 1) {
                clearInterval(playTimer);
                isPlaying = false;
                return;
            }
            currentStep++;
            showStep(currentStep);
        }, 1000);
    });

document
    .getElementById("pauseBtn")
    .addEventListener("click", () => {
        clearInterval(playTimer);
        isPlaying = false;
    });

document
    .getElementById("prevBtn")
    .addEventListener("click", () => {
        if (simulationSteps.length === 0) {
            return;
        }
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });