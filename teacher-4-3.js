
const API_BASE = "https://berandil.ir/farakhan-api";

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        throw new Error(`خطای API: ${response.status}`);
    }

    const result = await response.json();

    if (result && result.success === false) {
        throw new Error(result.message || "درخواست ناموفق بود");
    }

    return result;
}

let notificationAudio = null;
let soundEnabled = false;

function setupSound() {
    const button = document.getElementById("enableSoundButton");

    if (!button) {
        console.error("دکمه enableSoundButton در HTML پیدا نشد");
        return;
    }

    button.addEventListener("click", async () => {
        try {
            if (!soundEnabled) {
                notificationAudio = new Audio("notification.mp3");
                notificationAudio.preload = "auto";
                notificationAudio.volume = 1;

                await notificationAudio.play();
                notificationAudio.pause();
                notificationAudio.currentTime = 0;

                soundEnabled = true;
                button.innerText = "🔊 صدای فراخوان فعال است";
                button.style.background = "#22c55e";
            } else {
                soundEnabled = false;

                if (notificationAudio) {
                    notificationAudio.pause();
                    notificationAudio.currentTime = 0;
                }

                button.innerText = "🔇 صدای فراخوان غیرفعال است";
                button.style.background = "#ef4444";
            }
        } catch (error) {
            console.error("خطا در تغییر وضعیت صدا:", error);
            alert("خطا در تغییر وضعیت صدا: " + error.message);
        }
    });
}

function playNotificationSound() {
    if (!soundEnabled || !notificationAudio) return;

    notificationAudio.currentTime = 0;

    notificationAudio.play().catch(error => {
        console.error("خطا در پخش صدای فراخوان:", error);
    });
}

function showSendNotification(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) return;

    student.innerText = "📤 " + studentName + " ارسال شد";
    popup.classList.add("show");
    playNotificationSound();

    setTimeout(() => {
        popup.classList.remove("show");
    }, 5000);
}

function showCallPopup(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.error("عناصر callPopup یا callPopupStudent پیدا نشدند");
        return;
    }

    student.innerText = studentName + " فراخوان شد";
    popup.classList.add("show");
    playNotificationSound();

    setTimeout(() => {
        popup.classList.remove("show");
    }, 7000);
}

const students = [
    { name: "آرسام حسینی", className: "چهارم-3" },
    { name: "لیام رحمانی", className: "چهارم-3" },
    { name: "شاهان ترکاشوند", className: "چهارم-3" },
    { name: "ایلیا سبزپوش", className: "چهارم-3" },
    { name: "ماهان سمنارشاد", className: "چهارم-3" },
    { name: "آروین عابدی", className: "چهارم-3" },
    { name: "ایلیا عرشی", className: "چهارم-3" },
    { name: "آراد عطاییان", className: "چهارم-3" },
    { name: "آرتین علمی", className: "چهارم-3" },
    { name: "مهرسام غضنفری", className: "چهارم-3" },
    { name: "نیکان فرجی", className: "چهارم-3" },
    { name: "دانیال کشاورز", className: "چهارم-3" },
    { name: "کارن کوهی", className: "چهارم-3" },
    { name: "رایان منتظری", className: "چهارم-3" },
    { name: "آرین نیک پی", className: "چهارم-3" },
    { name: "ویهان وهابی", className: "چهارم-3" }
];

const studentsContainer = document.getElementById("studentsContainer");
const callCount = document.getElementById("callCount");

function getToday() {
    return new Intl.DateTimeFormat(
        "fa-IR-u-nu-latn",
        { year: "numeric", month: "2-digit", day: "2-digit" }
    ).format(new Date());
}

function getDatabaseToday() {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function createStudents() {
    if (!studentsContainer) {
        console.error("studentsContainer در HTML پیدا نشد");
        return;
    }

    studentsContainer.innerHTML = "";

    students.forEach(student => {
        const button = document.createElement("button");
        button.className = "student-button";
        button.dataset.name = student.name;

        button.innerHTML = `
            <div class="student-name"></div>
            <div class="student-status"></div>
            <div class="student-time"></div>
        `;

        button.querySelector(".student-name").innerText = student.name;
        button.addEventListener("click", () => sendStudent(student));

        studentsContainer.appendChild(button);
    });
}

function findButton(name) {
    return [...document.querySelectorAll(".student-button")]
        .find(button => button.dataset.name === name);
}

function updateButton(call) {
    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    button.classList.remove("called", "sent", "received", "pending");

    const status = button.querySelector(".student-status");
    const time = button.querySelector(".student-time");

    if (call.status === "فراخوان شد") {
        button.classList.add("called");
        status.innerText = "🔴 فراخوان";
    } else if (call.status === "دریافت فراخوان") {
        button.classList.add("received");
        status.innerText = "🟠 دریافت شد";
    } else if (call.status === "ارسال شد") {
        button.classList.add("sent");
        status.innerText = "🟢 ارسال شد";
    } else {
        button.classList.add("pending");
        status.innerText = "";
    }

    let timeText = "";

    if (call.called_time) {
        timeText = "🕐 فراخوان: " + call.called_time;
    }

    if (call.sent_time) {
        timeText += (timeText ? "\n" : "") + "📤 ارسال: " + call.sent_time;
    }

    time.innerText = timeText;
    time.style.whiteSpace = "pre-line";
}

function resetStudentButton(call) {
    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    button.classList.remove("called", "sent", "received");
    button.classList.add("pending");

    const status = button.querySelector(".student-status");
    const time = button.querySelector(".student-time");

    if (status) status.innerText = "";
    if (time) time.innerText = "";
}

function updateCount(data) {
    if (!Array.isArray(data)) {
        console.error("داده فراخوان‌ها آرایه نیست:", data);
        return;
    }

    const active = data.filter(call => call.status !== "ارسال شد");

    if (callCount) {
        callCount.innerText = active.length + " فراخوان";
    }
}

function resetTeacherPanel() {
    document.querySelectorAll(".student-button").forEach(button => {
        if (button.classList.contains("absent")) return;

        button.classList.remove("called", "sent", "received");
        button.classList.add("pending");

        const status = button.querySelector(".student-status");
        const time = button.querySelector(".student-time");

        if (status) status.innerText = "";
        if (time) time.innerText = "";
    });

    if (callCount) callCount.innerText = "0 فراخوان";
}

let previousCallStates = new Map();
let callsInitialized = false;
let callsLoading = false;
let absentLoading = false;
let currentTeacherCallDay = getToday();

function getCallKey(call) {
    return String(call.id);
}

async function loadCalls() {
    if (callsLoading) return;

    callsLoading = true;

    try {
        const params = new URLSearchParams({
            class_name: "چهارم-3",
            date: getToday()
        });

        const result = await apiRequest(
            `teacher-calls.php?${params.toString()}`
        );

        const data = Array.isArray(result)
            ? result
            : (Array.isArray(result.data) ? result.data : []);

        const nextStates = new Map();

        data.forEach(call => {
            const key = getCallKey(call);
            const oldCall = previousCallStates.get(key);

            nextStates.set(key, call);

            const button = findButton(call.student_name);

            if (button && button.classList.contains("absent")) {
                return;
            }

            if (
                callsInitialized &&
                !oldCall &&
                call.status === "فراخوان شد"
            ) {
                showCallPopup(call.student_name);
            } else if (
                callsInitialized &&
                oldCall &&
                oldCall.status !== "ارسال شد" &&
                call.status === "ارسال شد"
            ) {
                showSendNotification(call.student_name);
            }

            updateButton(call);
        });

        // پاک کردن وضعیت دانش‌آموزانی که دیگر فراخوان فعالی ندارند.
        document.querySelectorAll(".student-button").forEach(button => {
            if (button.classList.contains("absent")) return;

            const name = button.dataset.name;
            const hasCall = data.some(
                call => call.student_name === name
            );

            if (!hasCall) {
                button.classList.remove(
                    "called", "sent", "received"
                );
                button.classList.add("pending");

                const status = button.querySelector(".student-status");
                const time = button.querySelector(".student-time");

                if (status) status.innerText = "";
                if (time) time.innerText = "";
            }
        });

        previousCallStates = nextStates;
        callsInitialized = true;
        updateCount(data);

    } catch (error) {
        console.error("خطا در دریافت فراخوان‌ها:", error);
    } finally {
        callsLoading = false;
    }
}

async function loadAbsentStudents() {
    if (absentLoading) return;

    absentLoading = true;

    try {
        const params = new URLSearchParams({
            class_name: "چهارم-3",
            date: getDatabaseToday(),
            status: "غایب"
        });

        const result = await apiRequest(
            `attendance.php?${params.toString()}`
        );

        const data = Array.isArray(result)
            ? result
            : (Array.isArray(result.data) ? result.data : []);

        document.querySelectorAll(".student-button").forEach(button => {
            button.classList.remove("absent");
            button.disabled = false;

            const nameDiv = button.querySelector(".student-name");

            if (nameDiv) {
                nameDiv.innerText = button.dataset.name;
            }
        });

        data.forEach(absent => {
            if (absent.status !== "غایب") return;

            const button = findButton(absent.student_name);
            if (!button) return;

            button.classList.remove(
                "called", "sent", "received", "pending"
            );
            button.classList.add("absent");
            button.disabled = true;

            const nameDiv = button.querySelector(".student-name");
            const status = button.querySelector(".student-status");
            const time = button.querySelector(".student-time");

            if (nameDiv) {
                nameDiv.innerText = absent.student_name + " (غایب)";
            }

            if (status) status.innerText = "";
            if (time) time.innerText = "";
        });

    } catch (error) {
        console.error("خطا در دریافت غایبان:", error);
    } finally {
        absentLoading = false;
    }
}

async function sendStudent(student) {
    const button = findButton(student.name);

    if (button && button.classList.contains("absent")) {
        console.log("ارسال برای دانش‌آموز غایب مجاز نیست:", student.name);
        return;
    }

    try {
        const params = new URLSearchParams({
            class_name: "چهارم-3",
            date: getToday(),
            student_name: student.name
        });

        const result = await apiRequest(
            `teacher-calls.php?${params.toString()}`
        );

        const data = Array.isArray(result)
            ? result
            : (Array.isArray(result.data) ? result.data : []);

        const activeCalls = data
            .filter(call => call.student_name === student.name)
            .filter(call => call.status !== "ارسال شد")
            .sort((a, b) => Number(b.id) - Number(a.id));

        if (activeCalls.length === 0) {
            alert("برای این دانش‌آموز فراخوان فعالی پیدا نشد.");
            return;
        }

        const call = activeCalls[0];

        const time = new Date().toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        await apiRequest("update-call-status.php", {
            method: "POST",
            body: JSON.stringify({
                id: call.id,
                status: "ارسال شد",
                sent_time: time
            })
        });

        await loadCalls();

    } catch (error) {
        console.error("خطا در ارسال دانش‌آموز:", error);
        alert("ارسال انجام نشد. لطفاً اتصال یا API را بررسی کنید.");
    }
}

function checkTeacherCallDayChange() {
    const newDay = getToday();

    if (newDay === currentTeacherCallDay) return;

    console.log(
        "روز فراخوان تغییر کرد:",
        currentTeacherCallDay,
        "→",
        newDay
    );

    currentTeacherCallDay = newDay;

    previousCallStates.clear();
    callsInitialized = false;

    resetTeacherPanel();
    loadCalls();
    loadAbsentStudents();
}

async function startTeacherPanel() {
    setupSound();
    createStudents();

    await loadAbsentStudents();
    await loadCalls();

    // جایگزین Supabase Realtime
    setInterval(() => {
        loadCalls();
        loadAbsentStudents();
    }, 5000);

    setInterval(checkTeacherCallDayChange, 30000);
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startTeacherPanel,
        { once: true }
    );
} else {
    startTeacherPanel();
}
