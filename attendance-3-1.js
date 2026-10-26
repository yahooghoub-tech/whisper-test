
const API_URL = "https://berandil.ir/farakhan-api/attendance.php";
const className = "سوم-1";

const students = [
    { name: "ساتیار امیری", className: "سوم-1" },
    { name: "پارسا تقی زاده", className: "سوم-1" },
    { name: "رایان جمشیدی", className: "سوم-1" },
    { name: "رادین جمشیدی", className: "سوم-1" },
    { name: "کارن جهانی", className: "سوم-1" },
    { name: "بهراد حسینی نژاد", className: "سوم-1" },
    { name: "نویان خدامرادی", className: "سوم-1" },
    { name: "فرداد خدایاری", className: "سوم-1" },
    { name: "آدرین سلاجقه", className: "سوم-1" },
    { name: "شهریار سلگی", className: "سوم-1" },
    { name: "آراد شریفی", className: "سوم-1" },
    { name: "آرین صفری", className: "سوم-1" },
    { name: "رایان عیسی زاده", className: "سوم-1" },
    { name: "آرشان عیوض نژاد", className: "سوم-1" },
    { name: "کارن کاردان", className: "سوم-1" },
    { name: "رادمان کامکار", className: "سوم-1" },
    { name: "آرمان کریمیان", className: "سوم-1" },
    { name: "رهام ماندگارمقدم", className: "سوم-1" },
    { name: "رادمان مرادیان نژاد", className: "سوم-1" },
    { name: "مهراد ناصری", className: "سوم-1" },
    { name: "آریا نصیرمحمدی", className: "سوم-1" },
    { name: "پرهام دولتخواه", className: "سوم-1" },
    { name: "آریا نعمتی", className: "سوم-1" },
    { name: "ابوالفضل یوسفی", className: "سوم-1" }
];

const studentsContainer = document.getElementById("studentsContainer");
const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const todayDate = document.getElementById("todayDate");
const message = document.getElementById("message");

let isLoadingAttendance = false;
let isRefreshing = false;
let currentAttendanceDay = getToday();

function getToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = {};

    parts.forEach(part => {
        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    });

    return `${values.year}-${values.month}-${values.day}`;
}

function showDate() {
    todayDate.textContent = new Date().toLocaleDateString("fa-IR", {
        timeZone: "Asia/Tehran",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function showMessage(text) {
    message.textContent = text;
    message.classList.add("show");

    clearTimeout(window.messageTimer);

    window.messageTimer = setTimeout(() => {
        message.classList.remove("show");
    }, 2500);
}

async function apiRequest(url, options = {}) {
    const headers = {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers,
        cache: "no-store"
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

function normalizeText(value) {
    return String(value ?? "")
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[\u200c\u200f\u200e]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getLatestRecords(records) {
    const latest = new Map();

    function compareRecords(a, b) {
        const timeA = Date.parse(a.updated_at || "") || 0;
        const timeB = Date.parse(b.updated_at || "") || 0;

        if (timeA !== timeB) {
            return timeA - timeB;
        }

        const idA = Number(a.id);
        const idB = Number(b.id);

        if (Number.isFinite(idA) && Number.isFinite(idB)) {
            return idA - idB;
        }

        return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    }

    records.forEach(record => {
        const key = normalizeText(record.student_name);
        if (!key) return;

        const previous = latest.get(key);

        if (!previous || compareRecords(record, previous) >= 0) {
            latest.set(key, record);
        }
    });

    return latest;
}

function createStudents() {
    studentsContainer.innerHTML = "";

    students.forEach(student => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "student-button present";
        button.dataset.name = student.name;

        const nameSpan = document.createElement("span");
        nameSpan.className = "student-name";
        nameSpan.textContent = student.name;

        const statusSpan = document.createElement("span");
        statusSpan.className = "student-status";
        statusSpan.textContent = "حاضر";

        button.append(nameSpan, statusSpan);

        button.addEventListener("click", () => {
            toggleAttendance(student, button);
        });

        studentsContainer.appendChild(button);
    });

    totalCount.textContent = students.length;
    updateCounts();
}

function findButton(name) {
    const target = normalizeText(name);

    return Array.from(
        studentsContainer.querySelectorAll(".student-button")
    ).find(button => normalizeText(button.dataset.name) === target) || null;
}

function setButtonAbsent(button) {
    button.classList.remove("present");
    button.classList.add("absent");
    button.querySelector(".student-status").textContent = "غایب";
}

function setButtonPresent(button) {
    button.classList.remove("absent");
    button.classList.add("present");
    button.querySelector(".student-status").textContent = "حاضر";
}

function updateCounts() {
    const absent = studentsContainer.querySelectorAll(
        ".student-button.absent"
    ).length;

    const present = students.length - absent;

    absentCount.textContent = absent;
    presentCount.textContent = present;
    totalCount.textContent = students.length;
}

async function loadTodayAttendance(options = {}) {
    if (isLoadingAttendance) return;

    isLoadingAttendance = true;

    try {
        const today = getToday();
        const params = new URLSearchParams({
            class_name: className,
            date: today
        });

        const result = await apiRequest(
            `${API_URL}?${params.toString()}`
        );

        if (today !== getToday()) return;

        if (!Array.isArray(result.data)) {
            throw new Error("ساختار اطلاعات دریافتی از سرور نامعتبر است.");
        }

        const records = getLatestRecords(result.data);

        // دانش‌آموزی که رکورد ندارد، حاضر محسوب می‌شود.
        students.forEach(student => {
            const button = findButton(student.name);
            if (!button) return;

            const record = records.get(normalizeText(student.name));

            if (record && record.status === "غایب") {
                setButtonAbsent(button);
            } else {
                setButtonPresent(button);
            }
        });

        updateCounts();
    } catch (error) {
        console.error("خطا در دریافت حضور و غیاب:", error);

        if (options.showError) {
            showMessage("❌ خطا در دریافت اطلاعات حضور و غیاب");
        }
    } finally {
        isLoadingAttendance = false;
    }
}

async function toggleAttendance(student, button) {
    if (button.dataset.processing === "true") return;

    button.dataset.processing = "true";
    button.disabled = true;

    const today = getToday();
    const wasAbsent = button.classList.contains("absent");
    const newStatus = wasAbsent ? "حاضر" : "غایب";

    try {
        const result = await apiRequest(API_URL, {
            method: "POST",
            body: JSON.stringify({
                student_name: student.name,
                class_name: student.className,
                status: newStatus,
                attendance_date: today
            })
        });

        if (result.success !== true) {
            throw new Error("ثبت وضعیت توسط سرور تأیید نشد.");
        }

        if (today === getToday()) {
            if (newStatus === "غایب") {
                setButtonAbsent(button);
                showMessage(`⚫ ${student.name} غایب شد`);
            } else {
                setButtonPresent(button);
                showMessage(`🟢 ${student.name} حاضر شد`);
            }

            updateCounts();
            await loadTodayAttendance();
        } else {
            showMessage("روز عوض شده است؛ اطلاعات امروز در حال بارگذاری است.");
            await loadTodayAttendance();
        }
    } catch (error) {
        console.error("خطا در ثبت حضور و غیاب:", error);
        showMessage("❌ ثبت وضعیت انجام نشد؛ اتصال سرور را بررسی کنید.");
        await loadTodayAttendance();
    } finally {
        delete button.dataset.processing;
        button.disabled = false;
    }
}

async function refreshAttendance() {
    if (isRefreshing || document.hidden) return;

    isRefreshing = true;

    try {
        await loadTodayAttendance();
    } finally {
        isRefreshing = false;
    }
}

function checkAttendanceDayChange() {
    const newDay = getToday();

    if (newDay === currentAttendanceDay) return;

    console.log(
        "📅 روز جدید حضور و غیاب:",
        currentAttendanceDay,
        "→",
        newDay
    );

    currentAttendanceDay = newDay;
    showDate();
    createStudents();
    loadTodayAttendance({ showError: true });
}

// راه‌اندازی اولیه
showDate();
createStudents();
loadTodayAttendance({ showError: true });

// همگام‌سازی هر ۵ ثانیه
setInterval(() => {
    checkAttendanceDayChange();
    refreshAttendance();
}, 5000);

// به‌روزرسانی هنگام بازگشت به صفحه
window.addEventListener("focus", () => {
    checkAttendanceDayChange();
    refreshAttendance();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        checkAttendanceDayChange();
        refreshAttendance();
    }
});
