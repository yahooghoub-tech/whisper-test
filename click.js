/* =========================================
   تنظیمات پنل ناظم - بدون Supabase
========================================= */

const API_BASE = "https://berandil.ir/farakhan-api/";

const ATTENDANCE_API = API_BASE + "attendance.php";
const TEACHER_CALLS_API = API_BASE + "teacher-calls.php";
const CREATE_CALL_API = API_BASE + "calls.php";
const UPDATE_CALL_API = API_BASE + "update-call-status.php";
const DELETE_ALL_CALLS_API = API_BASE + "delete-all-calls.php";

const gradeOrder = [
    "پیش", "اول", "دوم", "سوم",
    "چهارم", "پنجم", "ششم"
];

const allowedClasses = [
    "پیش-1", "پیش-2",
    "اول-1", "اول-2", "اول-3",
    "دوم-1", "دوم-2",
    "سوم-1", "سوم-2", "سوم-3",
    "چهارم-1", "چهارم-2", "چهارم-3",
    "پنجم-1", "پنجم-2", "پنجم-3",
    "ششم-1", "ششم-2"
];

const container = document.getElementById("classesContainer");
const searchInput = document.getElementById("searchInput");
const resetButton = document.getElementById("resetCalls");

const attendanceState = new Map();
const latestCallState = new Map();

let refreshRunning = false;
let currentNazemDay = getDatabaseToday();
let lastSeenCallStatuses = new Map();

function normalizeText(value) {
    return String(value || "")
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\u200c/g, "")
        .replace(/ۀ/g, "ه")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, "")
        .trim();
}

function attendanceKey(studentName, className) {
    return normalizeText(studentName) + "|" +
           normalizeText(className);
}

function callKey(studentName, className) {
    return attendanceKey(studentName, className);
}

function getDatabaseToday() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function getPersianTime() {
    return new Intl.DateTimeFormat("fa-IR", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(new Date());
}

function hasAbsentAttendance(studentName, className) {
    return attendanceState.get(
        attendanceKey(studentName, className)
    ) === "غایب";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {})
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("پاسخ سرور معتبر نیست.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message ||
            `خطای سرور: ${response.status}`
        );
    }

    return result;
}
/* =========================================
   ساخت پایه‌ها، کلاس‌ها و دکمه‌ها
========================================= */

function classId(name) {
    return "class-" +
        name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "");
}

function createClasses() {
    if (!container) {
        console.error("عنصر classesContainer پیدا نشد.");
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
                Number(a.split("-")[1]) -
                Number(b.split("-")[1])
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

            const classHeader = document.createElement("div");
            classHeader.className = "class-header";

            const counter = document.createElement("span");
            counter.className = "called-total";
            counter.id = "called-" + className;
            counter.textContent = "0";

            const title = document.createElement("span");
            title.className = "class-title";
            title.textContent = className;

            const total = document.createElement("span");
            total.className = "student-total";
            total.textContent = groups[className].length;

            classHeader.append(counter, title, total);

            const list = document.createElement("div");
            list.className = "students-list";

            groups[className].forEach(student => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "student-button pending";

                button.dataset.name = student.name;
                button.dataset.class = student.className;

                const name = document.createElement("span");
                name.className = "student-name";
                name.textContent = student.name;

                const status = document.createElement("span");
                status.className = "student-status";

                const time = document.createElement("span");
                time.className = "status-time";

                button.append(name, status, time);

                button.addEventListener("click", () => {
                    callStudent(student, button);
                });

                list.appendChild(button);
            });

            box.append(classHeader, list);
            content.appendChild(box);
        });

        section.appendChild(content);
        container.appendChild(section);
    });
}

function findButton(name, className) {
    const wantedName = normalizeText(name);
    const wantedClass = normalizeText(className);

    for (const button of document.querySelectorAll(
        ".student-button"
    )) {
        if (
            normalizeText(button.dataset.name) === wantedName &&
            normalizeText(button.dataset.class) === wantedClass
        ) {
            return button;
        }
    }

    return null;
}

function updateCount(className) {
    const box = document.getElementById(classId(className));
    if (!box) return;

    const count = box.querySelectorAll(
        ".student-button.called, .student-button.sent"
    ).length;

    const counter = document.getElementById(
        "called-" + className
    );

    if (counter) counter.textContent = count;
}
/* =========================================
   به‌روزرسانی ظاهر دکمه دانش‌آموز
========================================= */

function updateButton(button, call, force = false) {
    if (!button || !call) return;

    const incomingId = Number(call.id || 0);
    const currentId = Number(button.dataset.callId || 0);

    // جلوگیری از بازنویسی وضعیت جدید با رکورد قدیمی
    if (incomingId && currentId && incomingId < currentId) {
        return;
    }

    button.dataset.callId = String(incomingId || "");
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

    if (
        !force &&
        hasAbsentAttendance(
            button.dataset.name,
            button.dataset.class
        )
    ) {
        button.classList.remove("pending", "called", "sent");
        button.classList.add("absent");
        button.disabled = true;

        if (statusElement) statusElement.textContent = "(غایب)";
        if (timeElement) timeElement.textContent = "";

        updateCount(button.dataset.class);
        return;
    }

    button.classList.remove(
        "pending", "called", "sent", "absent"
    );

    if (call.status === "ارسال شد") {
        button.classList.add("sent");
        button.disabled = false;
    } else {
        button.classList.add("called");

        // فراخوان والد از پنل ناظم لغو نشود
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

function resetButtonState(button) {
    if (!button) return;

    button.classList.remove("called", "sent", "absent");
    button.classList.add("pending");
    button.disabled = false;

    delete button.dataset.callId;
    delete button.dataset.callStatus;
    delete button.dataset.callSource;

    const status = button.querySelector(".student-status");
    const time = button.querySelector(".status-time");

    if (status) status.textContent = "";
    if (time) time.textContent = "";

    updateCount(button.dataset.class);
}

function updateParentCallButton(button, call) {
    if (!button || !call) return;

    button.dataset.callSource = "parent";
    updateButton(button, {
        ...call,
        source: "parent"
    }, true);

    button.style.background =
        "linear-gradient(135deg, #2563eb, #3b82f6)";
    button.style.color = "#fff";
    button.style.boxShadow =
        "0 8px 20px rgba(37, 99, 235, .25)";
}
/* =========================================
   ثبت و لغو فراخوان در MySQL
========================================= */

async function callStudent(student, button) {
    if (
        !button ||
        button.disabled ||
        button.classList.contains("absent") ||
        button.dataset.processing === "true"
    ) {
        return;
    }

    if (button.dataset.callSource === "parent") {
        alert("فراخوان ثبت‌شده توسط والدین از پنل ناظم قابل لغو نیست.");
        return;
    }

    button.dataset.processing = "true";
    button.disabled = true;

    try {
        if (button.classList.contains("called")) {
            const callId = Number(button.dataset.callId || 0);

            if (!callId) {
                await loadCalls();
                throw new Error(
                    "شناسه فراخوان مشخص نبود؛ وضعیت به‌روزرسانی شد. دوباره تلاش کنید."
                );
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

            await loadCalls();
            return;
        }

        const now = new Date();

        const calledDate = getDatabaseToday();

        const calledTime = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(now);

        const result = await apiRequest(CREATE_CALL_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                student_name: student.name,
                class_name: student.className,
                called_date: calledDate,
                called_time: calledTime
            })
        });

        if (!result.data) {
            throw new Error("اطلاعات فراخوان در پاسخ سرور موجود نیست.");
        }

        updateButton(button, result.data, true);
        await loadCalls();

    } catch (error) {
        console.error("خطا در ثبت یا لغو فراخوان:", error);

        alert(
            error.message ||
            "عملیات انجام نشد؛ اتصال سرور را بررسی کنید."
        );

        await loadCalls();

    } finally {
        delete button.dataset.processing;

        if (!button.classList.contains("absent")) {
            button.disabled =
                button.dataset.callSource === "parent";
        }
    }
}
/* =========================================
   دریافت وضعیت فراخوان‌ها از API
========================================= */

async function loadCalls() {
    const today = getDatabaseToday();

    const results = await Promise.all(
        allowedClasses.map(async className => {
            const url =
                TEACHER_CALLS_API +
                "?class_name=" + encodeURIComponent(className) +
                "&date=" + encodeURIComponent(today);

            const result = await apiRequest(url);

            return result.data || [];
        })
    );

    const latestCalls = new Map();

    results.flat().forEach(call => {
        const key = callKey(call.student_name, call.class_name);
        const previous = latestCalls.get(key);

        if (
            !previous ||
            Number(call.id || 0) > Number(previous.id || 0)
        ) {
            latestCalls.set(key, call);
        }
    });

    // ابتدا وضعیت دکمه‌ها را از رکوردهای جدید سرور همگام کن.
    for (const [key, call] of latestCalls) {
        const button = findButton(
            call.student_name,
            call.class_name
        );

        if (!button) continue;

        const previousStatus = lastSeenCallStatuses.get(key);
        const newStatus = call.status || "";

        if (
            previousStatus !== undefined &&
            previousStatus !== newStatus &&
            newStatus === "ارسال شد"
        ) {
            showTeacherSendPopup(call);
        }

        lastSeenCallStatuses.set(key, newStatus);
        latestCallState.set(key, call);

        updateButton(button, call);
    }

    // دکمه‌هایی که در پاسخ امروز نیستند، در صورت نبود وضعیت ثبت‌شده
    // به حالت اولیه برگردند. غیبت همچنان اولویت دارد.
    document.querySelectorAll(".student-button").forEach(button => {
        const key = callKey(
            button.dataset.name,
            button.dataset.class
        );

        if (
            !latestCalls.has(key) &&
            !hasAbsentAttendance(
                button.dataset.name,
                button.dataset.class
            )
        ) {
            latestCallState.delete(key);
            resetButtonState(button);
        }
    });

    allowedClasses.forEach(updateCount);
}

/* =========================================
   دریافت حضور و غیاب از API
========================================= */

async function loadTodayAttendance() {
    const today = getDatabaseToday();

    const results = await Promise.all(
        allowedClasses.map(async className => {
            const url =
                ATTENDANCE_API +
                "?class_name=" + encodeURIComponent(className) +
                "&date=" + encodeURIComponent(today);

            const result = await apiRequest(url);

            return result.data || [];
        })
    );

    attendanceState.clear();

    results.flat().forEach(record => {
        attendanceState.set(
            attendanceKey(record.student_name, record.class_name),
            record.status
        );
    });

    // ابتدا وضعیت حضور و غیاب اعمال شود؛ سپس فراخوان‌ها بازیابی شوند.
    document.querySelectorAll(".student-button").forEach(button => {
        const key = attendanceKey(
            button.dataset.name,
            button.dataset.class
        );

        const status = attendanceState.get(key);

        if (status === "غایب") {
            button.classList.remove("pending", "called", "sent");
            button.classList.add("absent");
            button.disabled = true;

            const label = button.querySelector(".student-status");
            const time = button.querySelector(".status-time");

            if (label) label.textContent = "(غایب)";
            if (time) time.textContent = "";
        } else if (status === "حاضر") {
            button.classList.remove("absent");
            button.disabled = false;

            const call = latestCallState.get(key);

            if (call) {
                updateButton(button, call, true);
            } else {
                resetButtonState(button);
            }
        } else {
            const call = latestCallState.get(key);

            if (call) {
                updateButton(button, call, true);
            } else {
                resetButtonState(button);
            }
        }
    });

    allowedClasses.forEach(updateCount);
}
/* =========================================
   اعلان ارسال توسط معلم
========================================= */

function showTeacherSendPopup(call) {
    const popup = document.getElementById("teacherSendPopup");
    const text = document.getElementById("teacherSendPopupText");
    const sound = document.getElementById("teacherSendSound");

    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.log("پخش خودکار صدا انجام نشد:", error);
        });
    }

    if (popup && text) {
        text.textContent =
            `دانش‌آموز ${call.student_name} از کلاس ${call.class_name} توسط معلم ارسال شد.`;

        popup.classList.add("show");

        clearTimeout(window.teacherSendPopupTimer);

        window.teacherSendPopupTimer = setTimeout(() => {
            popup.classList.remove("show");
        }, 6000);
    }
}

const closeTeacherSendPopup =
    document.getElementById("closeTeacherSendPopup");

if (closeTeacherSendPopup) {
    closeTeacherSendPopup.addEventListener("click", () => {
        document.getElementById("teacherSendPopup")
            ?.classList.remove("show");
    });
}

/* =========================================
   اعلان فراخوان والد
========================================= */

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

    content.append(title, message);
    popup.append(content, close);
    document.body.appendChild(popup);

    requestAnimationFrame(() => popup.classList.add("show"));

    function removePopup() {
        popup.classList.remove("show");
        setTimeout(() => popup.remove(), 300);
    }

    close.addEventListener("click", removePopup);

    clearTimeout(window.parentCallPopupTimer);

    window.parentCallPopupTimer = setTimeout(() => {
        if (popup.isConnected) removePopup();
    }, 7000);
}

/* =========================================
   جست‌وجوی دانش‌آموز
========================================= */

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

/* =========================================
   پاک‌کردن فراخوان‌ها
========================================= */

if (resetButton) {
    resetButton.addEventListener("click", async () => {
        if (!confirm("آیا تمام فراخوان‌ها حذف شوند؟")) return;

        resetButton.disabled = true;

        try {
            await apiRequest(DELETE_ALL_CALLS_API, {
                method: "POST"
            });

            latestCallState.clear();
            lastSeenCallStatuses.clear();

            document.querySelectorAll(".student-button").forEach(button => {
                if (
                    hasAbsentAttendance(
                        button.dataset.name,
                        button.dataset.class
                    )
                ) {
                    return;
                }

                resetButtonState(button);
            });

            allowedClasses.forEach(updateCount);

            alert(
                "فراخوان‌ها پاک شدند. اطلاعات حضور و غیاب حفظ شده‌اند."
            );

            await refreshNazemPanel();

        } catch (error) {
            console.error("خطا در پاک‌کردن فراخوان‌ها:", error);
            alert(error.message || "پاک‌کردن فراخوان‌ها انجام نشد.");
        } finally {
            resetButton.disabled = false;
        }
    });
}
/* =========================================
   همگام‌سازی پنل ناظم
========================================= */

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
            lastSeenCallStatuses.clear();
        }

        // حضور و غیاب و فراخوان‌ها از یک تاریخ و یک سرور خوانده شوند.
        await loadCalls();
        await loadTodayAttendance();

    } catch (error) {
        console.error("خطا در همگام‌سازی پنل ناظم:", error);
    } finally {
        refreshRunning = false;
    }
}

async function initializeNazem() {
    console.log("پنل ناظم با API هاست راه‌اندازی شد.");

    if (!container) {
        console.error("عنصر classesContainer پیدا نشد.");
        return;
    }

    createClasses();
    await refreshNazemPanel();
}

// راه‌اندازی پس از آماده‌شدن صفحه
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeNazem,
        { once: true }
    );
} else {
    initializeNazem();
}

// به‌روزرسانی دوره‌ای جایگزین Realtime سوپابیس
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
    if (document.visibilityState === "visible") {
        refreshNazemPanel();
    }
});