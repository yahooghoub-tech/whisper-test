
/* =====================================================
   پنل ناظم علوی - نسخه MySQL
   بدون Supabase و بدون Realtime
===================================================== */

const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const CREATE_CALL_API = `${API_BASE}/calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;
const DELETE_ALL_CALLS_API = `${API_BASE}/delete-all-calls.php`;

const gradeOrder = ["پیش", "اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"];

const container = document.getElementById("classesContainer");
const searchInput = document.getElementById("searchInput");
const resetButton = document.getElementById("resetCalls");

const attendanceState = new Map();
const latestCallState = new Map();

let refreshRunning = false;
let callsLoading = false;
let attendanceLoading = false;
let currentNazemDay = getDatabaseToday();

const allowedClasses = [
    "پیش-1", "پیش-2",
    "اول-1", "اول-2", "اول-3",
    "دوم-1", "دوم-2",
    "سوم-1", "سوم-2", "سوم-3",
    "چهارم-1", "چهارم-2", "چهارم-3",
    "پنجم-1", "پنجم-2", "پنجم-3",
    "ششم-1", "ششم-2"
];

function normalizeText(text) {
    return String(text || "")
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
        .replace(/\s+/g, "")
        .trim();
}

function attendanceKey(studentName, className) {
    return normalizeText(studentName) + "|" + normalizeText(className);
}

function classId(name) {
    return "class-" + name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "");
}

function getDatabaseToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        calendar: "gregory",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const getPart = type =>
        parts.find(part => part.type === type)?.value || "";

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function todayPersianDate() {
    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function timeNow() {
    return new Date().toLocaleTimeString("fa-IR", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        cache: "no-store",
        ...options,
        headers: {
            "Accept": "application/json",
            ...(options.headers || {})
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("پاسخ سرور JSON معتبر نیست.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `خطای سرور: ${response.status}`
        );
    }

    return result;
}

function hasAbsentAttendance(studentName, className) {
    return attendanceState.get(
        attendanceKey(studentName, className)
    ) === "غایب";
}

function findButton(name, className) {
    const wantedName = normalizeText(name);
    const wantedClass = normalizeText(className);

    return Array.from(
        document.querySelectorAll(".student-button")
    ).find(button =>
        normalizeText(button.dataset.name) === wantedName &&
        normalizeText(button.dataset.class) === wantedClass
    ) || null;
}

function showNazemMessage(message) {
    const element = document.getElementById("message");

    if (element) {
        element.textContent = message;
        element.classList.add("show");

        clearTimeout(window.nazemMessageTimer);

        window.nazemMessageTimer = setTimeout(() => {
            element.classList.remove("show");
        }, 3500);
    } else {
        console.log(message);
    }
}

/* =====================================================
   ساخت گروه پایه‌ها و کلاس‌ها
===================================================== */

function createClasses() {
    if (!container) {
        console.error("عنصر classesContainer در HTML پیدا نشد.");
        return;
    }

    container.innerHTML = "";

    const groups = {};

    students.forEach(student => {
        if (!groups[student.className]) {
            groups[student.className] = [];
        }

        groups[student.className].push(student);
    });

    gradeOrder.forEach(grade => {
        const classes = Object.keys(groups)
            .filter(name => name.startsWith(grade + "-"))
            .sort((a, b) =>
                Number(a.split("-")[1]) - Number(b.split("-")[1])
            );

        if (!classes.length) return;

        const section = document.createElement("section");
        section.className = "grade-section";

        const header = document.createElement("div");
        header.className = "grade-header";
        header.innerHTML = `
            <span>📚 پایه ${grade}</span>
            <span class="grade-arrow">▼</span>
        `;

        const content = document.createElement("div");
        content.className = "grade-content";

        header.addEventListener("click", () => {
            section.classList.toggle("closed");
        });

        section.append(header, content);

        classes.forEach(className => {
            groups[className].sort((a, b) =>
                a.name.localeCompare(b.name, "fa")
            );

            const box = document.createElement("div");
            box.className = "class-box";
            box.id = classId(className);

            box.innerHTML = `
                <div class="class-header">
                    <span class="called-total" id="called-${className}">0</span>
                    <span class="class-title">${className}</span>
                    <span class="student-total">${groups[className].length}</span>
                </div>
                <div class="students-list"></div>
            `;

            const list = box.querySelector(".students-list");

            groups[className].forEach(student => {
                const button = document.createElement("button");

                button.type = "button";
                button.className = "student-button pending";
                button.dataset.name = student.name;
                button.dataset.class = student.className;

                button.innerHTML = `
                    <span class="student-name"></span>
                    <span class="student-status"></span>
                    <span class="status-time"></span>
                `;

                button.querySelector(".student-name").textContent =
                    student.name;

                button.addEventListener("click", () => {
                    callStudent(student, button);
                });

                list.appendChild(button);
            });

            content.appendChild(box);
        });

        container.appendChild(section);
    });
}

/* =====================================================
   نمایش وضعیت فراخوان روی دکمه
===================================================== */

function updateButton(button, call, force = false) {
    if (!button || !call) return;

    const key = attendanceKey(
        button.dataset.name,
        button.dataset.class
    );

    // غیبت بر وضعیت فراخوان اولویت دارد.
    if (!force && attendanceState.get(key) === "غایب") {
        applyAttendanceToNazem({
            student_name: button.dataset.name,
            class_name: button.dataset.class,
            status: "غایب"
        });
        return;
    }

    const incomingId = Number(call.id || 0);
    const currentId = Number(button.dataset.callId || 0);
    const currentStatus = button.dataset.callStatus || "";

    if (incomingId && currentId && incomingId < currentId) {
        return;
    }

    // وضعیت «ارسال شد» را با اطلاعات قدیمی همان فراخوان برنگردان.
    if (
        incomingId &&
        incomingId === currentId &&
        currentStatus === "ارسال شد" &&
        call.status === "فراخوان شد"
    ) {
        return;
    }

    button.dataset.callId = String(incomingId);
    button.dataset.callStatus = call.status || "";
    button.dataset.callSource = call.source || "nazem";

    const statusElement = button.querySelector(".student-status");
    const timeElement = button.querySelector(".status-time");

    if (call.status === "لغو شد") {
        button.classList.remove("called", "sent", "absent");
        button.classList.add("pending");
        button.disabled = false;

        if (statusElement) statusElement.textContent = "";
        if (timeElement) timeElement.textContent = "";

        updateCount(button.dataset.class);
        return;
    }

    button.classList.remove("pending", "called", "sent", "absent");

    if (call.status === "ارسال شد") {
        button.classList.add("sent");
        button.disabled = false;
    } else {
        button.classList.add("called");
        button.disabled = call.source === "parent";
    }

    if (statusElement) {
        statusElement.textContent =
            call.source === "parent"
                ? "(فراخوان والد)"
                : `(${call.status || "فراخوان شد"})`;
    }

    if (timeElement) {
        timeElement.textContent = call.called_time || "";
    }

    updateCount(button.dataset.class);
}

/* =====================================================
   اعمال وضعیت حضور و غیاب
===================================================== */

function applyAttendanceToNazem(record) {
    if (!record) return;

    const button = findButton(
        record.student_name,
        record.class_name
    );

    if (!button) return;

    const key = attendanceKey(
        record.student_name,
        record.class_name
    );

    attendanceState.set(key, record.status);

    const nameElement = button.querySelector(".student-name");
    const statusElement = button.querySelector(".student-status");
    const timeElement = button.querySelector(".status-time");

    if (record.status === "غایب") {
        button.classList.remove("pending", "called", "sent");
        button.classList.add("absent");
        button.disabled = true;

        if (nameElement) {
            nameElement.textContent = record.student_name + " (غایب)";
        }

        if (statusElement) statusElement.textContent = "غایب";
        if (timeElement) timeElement.textContent = "";

        return;
    }

    if (record.status === "حاضر") {
        button.classList.remove("absent");

        if (nameElement) {
            nameElement.textContent = record.student_name;
        }

        const previousCall = latestCallState.get(key);

        if (previousCall) {
            updateButton(button, previousCall, true);
        } else {
            button.classList.remove("called", "sent");
            button.classList.add("pending");
            button.disabled = false;

            if (statusElement) statusElement.textContent = "";
            if (timeElement) timeElement.textContent = "";
        }
    }
}

/* =====================================================
   شمارش فراخوان‌های هر کلاس
===================================================== */

function updateCount(className) {
    const box = document.getElementById(classId(className));
    if (!box) return;

    const count = box.querySelectorAll(
        ".student-button.called, .student-button.sent"
    ).length;

    const counter = document.getElementById("called-" + className);

    if (counter) {
        counter.textContent = String(count);
    }
}

/* =====================================================
   دریافت فراخوان‌های تمام کلاس‌ها از هاست
===================================================== */

async function loadCalls() {
    if (callsLoading) return;

    callsLoading = true;

    try {
        const today = getDatabaseToday();

        const results = await Promise.all(
            allowedClasses.map(async className => {
                const url = CALLS_API + "?" + new URLSearchParams({
                    class_name: className,
                    date: today,
                    _: Date.now()
                });

                const result = await apiRequest(url);

                return Array.isArray(result.data)
                    ? result.data
                    : [];
            })
        );

        if (today !== getDatabaseToday()) return;

        const calls = results.flat();
        const newestCalls = new Map();

        calls.forEach(call => {
            if (!call.student_name || !call.class_name) return;

            const key = attendanceKey(
                call.student_name,
                call.class_name
            );

            const previous = newestCalls.get(key);

            if (!previous || Number(call.id) > Number(previous.id)) {
                newestCalls.set(key, call);
            }
        });

        latestCallState.clear();

        newestCalls.forEach((call, key) => {
            latestCallState.set(key, call);

            const button = findButton(
                call.student_name,
                call.class_name
            );

            if (button) {
                updateButton(button, call);
            }
        });

        // وضعیت فراخوان‌های قدیمی که امروز دیگر فعال نیستند پاک شود.
        document.querySelectorAll(".student-button").forEach(button => {
            const key = attendanceKey(
                button.dataset.name,
                button.dataset.class
            );

            if (
                !latestCallState.has(key) &&
                attendanceState.get(key) !== "غایب"
            ) {
                button.classList.remove("called", "sent", "absent");
                button.classList.add("pending");
                button.disabled = false;

                const status = button.querySelector(".student-status");
                const time = button.querySelector(".status-time");

                if (status) status.textContent = "";
                if (time) time.textContent = "";

                delete button.dataset.callId;
                delete button.dataset.callStatus;
                delete button.dataset.callSource;
            }
        });

        allowedClasses.forEach(updateCount);

    } catch (error) {
        console.error("خطا در دریافت فراخوان‌ها:", error);
    } finally {
        callsLoading = false;
    }
}

/* =====================================================
   دریافت حضور و غیاب تمام کلاس‌ها از MySQL
===================================================== */

async function loadTodayAttendance() {
    if (attendanceLoading) return;

    attendanceLoading = true;

    try {
        const today = getDatabaseToday();

        const results = await Promise.all(
            allowedClasses.map(async className => {
                const url = ATTENDANCE_API + "?" + new URLSearchParams({
                    class_name: className,
                    date: today,
                    _: Date.now()
                });

                const result = await apiRequest(url);

                return Array.isArray(result.data)
                    ? result.data
                    : [];
            })
        );

        if (today !== getDatabaseToday()) return;

        const records = results.flat();

        attendanceState.clear();

        // تمام دکمه‌ها ابتدا به وضعیت عادی برمی‌گردند.
        document.querySelectorAll(".student-button").forEach(button => {
            button.classList.remove("absent");
            button.disabled = false;

            const nameElement = button.querySelector(".student-name");

            if (nameElement) {
                nameElement.textContent = button.dataset.name;
            }
        });

        records.forEach(record => {
            if (
                record.attendance_date !== today ||
                !allowedClasses.includes(record.class_name)
            ) {
                return;
            }

            const studentExists = students.some(student =>
                normalizeText(student.name) ===
                    normalizeText(record.student_name) &&
                student.className === record.class_name
            );

            if (!studentExists) return;

            attendanceState.set(
                attendanceKey(
                    record.student_name,
                    record.class_name
                ),
                record.status
            );
        });

        // وضعیت فراخوان را ابتدا نمایش می‌دهیم.
        latestCallState.forEach(call => {
            const button = findButton(
                call.student_name,
                call.class_name
            );

            if (button) updateButton(button, call);
        });

        // در نهایت وضعیت حضور و غیاب اولویت دارد.
        records.forEach(record => {
            if (
                record.attendance_date === today &&
                (record.status === "غایب" ||
                 record.status === "حاضر")
            ) {
                applyAttendanceToNazem(record);
            }
        });

        lastAttendanceRefresh = Date.now();

    } catch (error) {
        console.error("خطا در دریافت حضور و غیاب:", error);
    } finally {
        attendanceLoading = false;
    }
}

let lastAttendanceRefresh = 0;

/* =====================================================
   ثبت فراخوان دانش‌آموز از پنل ناظم
===================================================== */

async function callStudent(student, button) {
    if (!button || button.disabled) return;

    if (hasAbsentAttendance(student.name, student.className)) {
        alert("این دانش‌آموز غایب است و امکان فراخوانی او وجود ندارد.");
        return;
    }

    if (button.dataset.processing === "true") return;

    // فراخوان ثبت‌شده توسط والدین از پنل ناظم لغو نشود.
    if (
        button.dataset.callSource === "parent" &&
        button.classList.contains("called")
    ) {
        alert("فراخوان ثبت‌شده توسط والدین از پنل ناظم قابل لغو نیست.");
        return;
    }

    button.dataset.processing = "true";
    button.disabled = true;

    try {
        const today = getDatabaseToday();

        if (button.classList.contains("called")) {
            const callId = Number(button.dataset.callId || 0);

            if (!callId) {
                await loadCalls();
                showNazemMessage("وضعیت فراخوان تازه‌سازی شد؛ دوباره تلاش کن.");
                return;
            }

            await apiRequest(UPDATE_CALL_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: callId,
                    status: "لغو شد"
                })
            });

            await refreshNazemPanel();
            showNazemMessage("فراخوان لغو شد.");
            return;
        }

        const now = new Date();

        const calledTime = now.toLocaleTimeString("en-GB", {
            timeZone: "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        const result = await apiRequest(CREATE_CALL_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                student_name: student.name,
                class_name: student.className,
                called_date: today,
                called_time: calledTime
            })
        });

        if (hasAbsentAttendance(student.name, student.className)) {
            alert("وضعیت دانش‌آموز غایب است؛ فراخوان ارسال نشد.");
            return;
        }

        if (result.data) {
            const key = attendanceKey(student.name, student.className);

            latestCallState.set(key, result.data);
            updateButton(button, result.data, true);
        }

        await refreshNazemPanel();
        showNazemMessage("فراخوان " + student.name + " ثبت شد.");

    } catch (error) {
        console.error("خطا در ثبت یا لغو فراخوان:", error);

        alert(
            error.message ||
            "عملیات ناموفق بود. APIهای هاست را بررسی کن."
        );

        await refreshNazemPanel();

    } finally {
        delete button.dataset.processing;

        if (!button.classList.contains("absent")) {
            button.disabled =
                button.dataset.callSource === "parent" &&
                button.classList.contains("called");
        }
    }
}

/* =====================================================
   اعلان ارسال دانش‌آموز توسط معلم
===================================================== */

function showTeacherSendPopup(call) {
    const sound = document.getElementById("teacherSendSound");

    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.log("پخش خودکار صدا انجام نشد:", error);
        });
    }

    const popup = document.getElementById("teacherSendPopup");
    const text = document.getElementById("teacherSendPopupText");

    if (!popup || !text) return;

    text.textContent =
        `دانش‌آموز ${call.student_name} از کلاس ${call.class_name} توسط معلم ارسال شد.`;

    popup.classList.add("show");

    clearTimeout(window.teacherSendPopupTimer);

    window.teacherSendPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 6000);
}

const closeTeacherSendPopup =
    document.getElementById("closeTeacherSendPopup");

if (closeTeacherSendPopup) {
    closeTeacherSendPopup.addEventListener("click", () => {
        document.getElementById("teacherSendPopup")
            ?.classList.remove("show");
    });
}

/* =====================================================
   اعلان فراخوان ثبت‌شده توسط والد
===================================================== */

function showParentCallPopup(call) {
    document.getElementById("parentCallPopup")?.remove();

    const popup = document.createElement("div");
    popup.id = "parentCallPopup";

    const content = document.createElement("div");
    content.className = "parent-call-popup-content";

    const title = document.createElement("div");
    title.className = "parent-call-popup-title";
    title.textContent = "فراخوانی توسط والد";

    const message = document.createElement("div");
    message.className = "parent-call-popup-text";
    message.textContent =
        `دانش‌آموز ${call.student_name} از کلاس ${call.class_name} توسط والد فراخوانی شد.`;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "parent-call-popup-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "بستن اعلان");

    content.append(title, message);
    popup.append(content, close);
    document.body.appendChild(popup);

    requestAnimationFrame(() => popup.classList.add("show"));

    close.addEventListener("click", () => {
        popup.classList.remove("show");
        setTimeout(() => popup.remove(), 300);
    });

    clearTimeout(window.parentCallPopupTimer);

    window.parentCallPopupTimer = setTimeout(() => {
        if (!popup.isConnected) return;

        popup.classList.remove("show");
        setTimeout(() => popup.remove(), 300);
    }, 7000);
}

/* =====================================================
   جست‌وجوی دانش‌آموز
===================================================== */

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const value = normalizeText(searchInput.value);

        document.querySelectorAll(".student-button").forEach(button => {
            const name = normalizeText(button.dataset.name);

            button.classList.toggle(
                "search-hidden",
                Boolean(value) && !name.includes(value)
            );
        });

        document.querySelectorAll(".class-box").forEach(box => {
            const visible = box.querySelectorAll(
                ".student-button:not(.search-hidden)"
            ).length;

            box.style.display = visible ? "" : "none";
        });

        document.querySelectorAll(".grade-section").forEach(section => {
            const visible = section.querySelectorAll(
                ".student-button:not(.search-hidden)"
            ).length;

            section.style.display = visible ? "" : "none";
        });
    });
}

/* =====================================================
   پاک کردن فراخوان‌ها
   حضور و غیاب نباید حذف شود.
===================================================== */

if (resetButton) {
    resetButton.addEventListener("click", async () => {
        const confirmed = confirm(
            "آیا از حذف تمام فراخوان‌ها مطمئن هستید؟ اطلاعات حضور و غیاب حذف نمی‌شود."
        );

        if (!confirmed) return;

        resetButton.disabled = true;

        try {
            await apiRequest(DELETE_ALL_CALLS_API, {
                method: "POST"
            });

            latestCallState.clear();

            document.querySelectorAll(".student-button").forEach(button => {
                button.classList.remove("called", "sent", "absent");
                button.classList.add("pending");

                delete button.dataset.callId;
                delete button.dataset.callStatus;
                delete button.dataset.callSource;

                const status = button.querySelector(".student-status");
                const time = button.querySelector(".status-time");
                const name = button.querySelector(".student-name");

                if (status) status.textContent = "";
                if (time) time.textContent = "";
                if (name) name.textContent = button.dataset.name;

                button.disabled = false;
            });

            // بعد از پاک‌سازی، وضعیت غیبت‌ها دوباره اعمال می‌شود.
            await loadTodayAttendance();

            allowedClasses.forEach(updateCount);

            showNazemMessage("فراخوان‌ها حذف شدند؛ اطلاعات حضور و غیاب حفظ شد.");

        } catch (error) {
            console.error("خطا در پاک کردن فراخوان‌ها:", error);
            alert(error.message || "پاک کردن فراخوان‌ها ناموفق بود.");
        } finally {
            resetButton.disabled = false;
        }
    });
}

/* =====================================================
   تازه‌سازی پنل از هاست
===================================================== */

async function refreshNazemPanel() {
    if (
        refreshRunning ||
        document.visibilityState !== "visible" ||
        !navigator.onLine
    ) {
        return;
    }

    refreshRunning = true;

    try {
        const today = getDatabaseToday();

        if (today !== currentNazemDay) {
            currentNazemDay = today;
            attendanceState.clear();
            latestCallState.clear();
        }

        // ترتیب مهم است: ابتدا فراخوان‌ها، سپس حضور و غیاب.
        await loadCalls();
        await loadTodayAttendance();

    } catch (error) {
        console.error("خطا در تازه‌سازی پنل ناظم:", error);
    } finally {
        refreshRunning = false;
    }
}

/* =====================================================
   راه‌اندازی اولیه
===================================================== */

async function initializeNazem() {
    console.log("پنل ناظم با API هاست راه‌اندازی شد.");

    createClasses();

    await refreshNazemPanel();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeNazem,
        { once: true }
    );
} else {
    initializeNazem();
}

/* =====================================================
   به‌روزرسانی خودکار
===================================================== */

setInterval(() => {
    refreshNazemPanel();
}, 5000);

window.addEventListener("focus", () => {
    refreshNazemPanel();
});

window.addEventListener("online", () => {
    refreshNazemPanel();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshNazemPanel();
    }
});
