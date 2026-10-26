
const API_URL = "https://berandil.ir/farakhan-api/attendance.php";
const className = "چهارم-1";

const students = [
    { name: "محمدطاها احمدی", className: "چهارم-1" },
    { name: "رادمهر بشیری", className: "چهارم-1" },
    { name: "مهراد بیاتی", className: "چهارم-1" },
    { name: "آران باروتی", className: "چهارم-1" },
    { name: "پوریا توکلیان", className: "چهارم-1" },
    { name: "رادین حسنی", className: "چهارم-1" },
    { name: "اوتانا درویشی", className: "چهارم-1" },
    { name: "امیرعباس دهقان", className: "چهارم-1" },
    { name: "سام زندمقدم", className: "چهارم-1" },
    { name: "مهراد سفارزاد", className: "چهارم-1" },
    { name: "نویان علیشاهی", className: "چهارم-1" },
    { name: "مهراد عموحسن", className: "چهارم-1" },
    { name: "کوروش قاسمی", className: "چهارم-1" },
    { name: "محمدحسین قرابیگلو", className: "چهارم-1" },
    { name: "محمدحسین کریمی", className: "چهارم-1" },
    { name: "رهام لطفی", className: "چهارم-1" },
    { name: "امیرعلی ناعمی", className: "چهارم-1" },
    { name: "یاشام درگاهی", className: "چهارم-1" },
    { name: "رایان مقدسی", className: "چهارم-1" }
];

const studentsContainer = document.getElementById("studentsContainer");
const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const todayDate = document.getElementById("todayDate");
const message = document.getElementById("message");

let currentAttendanceDay = getToday();
let isLoadingAttendance = false;
let isRefreshing = false;

// تاریخ روز بر اساس منطقه زمانی تهران
function getToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = {};

    parts.forEach(part => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
}

// یکسان‌سازی نام‌های فارسی
function normalizeText(text) {
    return String(text || "")
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\u200c/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// درخواست به API اختصاصی
async function apiRequest(url, options = {}) {
    const headers = { ...(options.headers || {}) };

    if (options.body) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers,
        cache: "no-store"
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("پاسخ سرور معتبر نیست.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `خطای سرور: ${response.status}`
        );
    }

    return result;
}

function showDate() {
    todayDate.textContent = new Date().toLocaleDateString(
        "fa-IR",
        {
            timeZone: "Asia/Tehran",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}

function showMessage(text) {
    message.textContent = text;
    message.classList.add("show");

    clearTimeout(window.messageTimer);

    window.messageTimer = setTimeout(() => {
        message.classList.remove("show");
    }, 2500);
}

function createStudents() {
    studentsContainer.innerHTML = "";

    students.forEach(student => {
        const button = document.createElement("button");
        button.className = "student-button present";
        button.dataset.name = student.name;

        const nameSpan = document.createElement("span");
        nameSpan.className = "student-name";
        nameSpan.textContent = student.name;

        const statusSpan = document.createElement("span");
        statusSpan.className = "student-status";
        statusSpan.textContent = "حاضر";

        button.appendChild(nameSpan);
        button.appendChild(statusSpan);

        button.addEventListener("click", () => {
            toggleAttendance(student, button);
        });

        studentsContainer.appendChild(button);
    });

    totalCount.textContent = students.length;
    updateCounts();
}

function findButton(name) {
    const targetName = normalizeText(name);

    return Array.from(
        studentsContainer.querySelectorAll(".student-button")
    ).find(button =>
        normalizeText(button.dataset.name) === targetName
    ) || null;
}

function setButtonAbsent(button) {
    button.classList.remove("present");
    button.classList.add("absent");

    const status = button.querySelector(".student-status");

    if (status) {
        status.textContent = "غایب";
    }
}

function setButtonPresent(button) {
    button.classList.remove("absent");
    button.classList.add("present");

    const status = button.querySelector(".student-status");

    if (status) {
        status.textContent = "حاضر";
    }
}

// انتخاب جدیدترین رکورد هر دانش‌آموز
function getLatestRecords(records) {
    const latest = new Map();

    records.forEach(record => {
        const key = normalizeText(record.student_name);

        if (!key) return;

        const previous = latest.get(key);

        if (!previous) {
            latest.set(key, record);
            return;
        }

        const previousTime = previous.updated_at
            ? new Date(previous.updated_at).getTime()
            : 0;

        const currentTime = record.updated_at
            ? new Date(record.updated_at).getTime()
            : 0;

        const previousId = Number(previous.id) || 0;
        const currentId = Number(record.id) || 0;

        if (
            currentTime > previousTime ||
            (currentTime === previousTime && currentId > previousId)
        ) {
            latest.set(key, record);
        }
    });

    return latest;
}

// دریافت وضعیت حضور و غیاب
async function loadTodayAttendance(options = {}) {
    if (isLoadingAttendance) return;

    isLoadingAttendance = true;

    try {
        const url = new URL(API_URL);
        url.searchParams.set("class_name", className);
        url.searchParams.set("date", getToday());

        const result = await apiRequest(url.toString());

        if (!Array.isArray(result.data)) {
            throw new Error("ساختار اطلاعات دریافتی معتبر نیست.");
        }

        const records = getLatestRecords(result.data);

        students.forEach(student => {
            const button = findButton(student.name);

            if (!button) return;

            const record = records.get(
                normalizeText(student.name)
            );

            if (record && record.status === "غایب") {
                setButtonAbsent(button);
            } else {
                // دانش‌آموز بدون رکورد، حاضر محسوب می‌شود.
                setButtonPresent(button);
            }
        });

        updateCounts();
    } catch (error) {
        console.error("خطا در دریافت حضور و غیاب:", error);

        if (options.showError) {
            showMessage("خطا در دریافت اطلاعات حضور و غیاب");
        }
    } finally {
        isLoadingAttendance = false;
    }
}

// ثبت وضعیت دانش‌آموز
async function toggleAttendance(student, button) {
    if (button.dataset.processing === "true") return;

    button.dataset.processing = "true";
    button.disabled = true;

    const today = getToday();
    const isAbsent = button.classList.contains("absent");
    const newStatus = isAbsent ? "حاضر" : "غایب";

    try {
        await apiRequest(API_URL, {
            method: "POST",
            body: JSON.stringify({
                student_name: student.name,
                class_name: student.className,
                status: newStatus,
                attendance_date: today
            })
        });

        if (getToday() !== today) {
            await checkAttendanceDayChange();
            showMessage("تاریخ تغییر کرد؛ اطلاعات روز جدید بارگذاری شد.");
            return;
        }

        if (newStatus === "غایب") {
            setButtonAbsent(button);
            showMessage(`⚫ ${student.name} غایب شد`);
        } else {
            setButtonPresent(button);
            showMessage(`🟢 ${student.name} حاضر شد`);
        }

        updateCounts();

        // دریافت مجدد اطلاعات برای هماهنگی با سرور
        await loadTodayAttendance();
    } catch (error) {
        console.error("خطا در ثبت حضور و غیاب:", error);
        showMessage("❌ ثبت وضعیت انجام نشد");

        await loadTodayAttendance();
    } finally {
        delete button.dataset.processing;
        button.disabled = false;
    }
}

function updateCounts() {
    const absent = studentsContainer.querySelectorAll(
        ".student-button.absent"
    ).length;

    const present = students.length - absent;

    absentCount.textContent = absent;
    presentCount.textContent = present;
}

// بررسی تغییر روز
async function checkAttendanceDayChange() {
    const newDay = getToday();

    if (newDay === currentAttendanceDay) return;

    console.log(
        "روز جدید حضور و غیاب:",
        currentAttendanceDay,
        "→",
        newDay
    );

    currentAttendanceDay = newDay;

    showDate();
    createStudents();

    await loadTodayAttendance();
}

// همگام‌سازی دوره‌ای
async function refreshAttendance() {
    if (isRefreshing || document.hidden) return;

    isRefreshing = true;

    try {
        await checkAttendanceDayChange();
        await loadTodayAttendance();
    } finally {
        isRefreshing = false;
    }
}

// راه‌اندازی اولیه
showDate();
createStudents();
loadTodayAttendance({ showError: true });

// همگام‌سازی هر ۵ ثانیه
setInterval(refreshAttendance, 5000);

// بررسی تغییر روز هر ۳۰ ثانیه
setInterval(checkAttendanceDayChange, 30000);

// به‌روزرسانی هنگام بازگشت به صفحه
window.addEventListener("focus", refreshAttendance);

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshAttendance();
    }
});
