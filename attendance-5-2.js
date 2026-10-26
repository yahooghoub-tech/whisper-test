
const API_URL = "https://berandil.ir/farakhan-api/attendance.php";

const className = "پنجم-2";

const students = [
    { name: "کیان امامقلی", className: "پنجم-2" },
    { name: "مهراد امانی پور", className: "پنجم-2" },
    { name: "هیوا بهرامی", className: "پنجم-2" },
    { name: "اهورا تاتلاری", className: "پنجم-2" },
    { name: "کیان چابکی", className: "پنجم-2" },
    { name: "آرتین خدمتلو", className: "پنجم-2" },
    { name: "ویهان داداشعلی", className: "پنجم-2" },
    { name: "ماجد رسولی", className: "پنجم-2" },
    { name: "طاها زرگر", className: "پنجم-2" },
    { name: "ایلیا عباسی", className: "پنجم-2" },
    { name: "یزدان عبدالهی", className: "پنجم-2" },
    { name: "مهرسام علایی", className: "پنجم-2" },
    { name: "آرن فلاح", className: "پنجم-2" },
    { name: "مهراد فلاحتی", className: "پنجم-2" },
    { name: "امیرحافظ قمی", className: "پنجم-2" },
    { name: "امیرعلی کازرانی", className: "پنجم-2" },
    { name: "کیاراد کاظمی", className: "پنجم-2" },
    { name: "یاسان لشگری نژاد", className: "پنجم-2" },
    { name: "آریا لطیفی", className: "پنجم-2" },
    { name: "برسام محمداسماعیل", className: "پنجم-2" },
    { name: "سامیار مرادی", className: "پنجم-2" },
    { name: "سورنا مرادی", className: "پنجم-2" },
    { name: "یاسین مولایی", className: "پنجم-2" },
    { name: "محمدصدرا میرصادقی", className: "پنجم-2" },
    { name: "رادین یاهو", className: "پنجم-2" }
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

// تاریخ امروز با منطقه زمانی تهران
function getToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const date = {};
    parts.forEach(part => {
        date[part.type] = part.value;
    });

    return `${date.year}-${date.month}-${date.day}`;
}

// یکسان‌سازی نام فارسی برای تطبیق رکوردها
function normalizeName(name) {
    return String(name || "")
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\u200c/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// ارسال و دریافت اطلاعات از API
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers
        },
        cache: "no-store"
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `خطای سرور (${response.status})`
        );
    }

    return result;
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

function findButton(name) {
    const normalized = normalizeName(name);

    return Array.from(
        studentsContainer.querySelectorAll(".student-button")
    ).find(button =>
        normalizeName(button.dataset.name) === normalized
    ) || null;
}

function setButtonAbsent(button) {
    button.classList.remove("present");
    button.classList.add("absent");

    const status = button.querySelector(".student-status");
    if (status) status.textContent = "غایب";
}

function setButtonPresent(button) {
    button.classList.remove("absent");
    button.classList.add("present");

    const status = button.querySelector(".student-status");
    if (status) status.textContent = "حاضر";
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

// انتخاب آخرین رکورد در صورت وجود رکورد تکراری
function getLatestRecords(records) {
    const latestByStudent = new Map();

    records.forEach(record => {
        const key = normalizeName(record.student_name);
        if (!key) return;

        const previous = latestByStudent.get(key);

        if (!previous) {
            latestByStudent.set(key, record);
            return;
        }

        const previousTime = Date.parse(previous.updated_at || "") || 0;
        const currentTime = Date.parse(record.updated_at || "") || 0;

        if (
            currentTime > previousTime ||
            (
                currentTime === previousTime &&
                Number(record.id || 0) > Number(previous.id || 0)
            )
        ) {
            latestByStudent.set(key, record);
        }
    });

    return latestByStudent;
}

async function loadTodayAttendance(options = {}) {
    if (isLoadingAttendance) return;

    isLoadingAttendance = true;

    try {
        const params = new URLSearchParams({
            class_name: className,
            date: getToday()
        });

        const result = await apiRequest(
            `${API_URL}?${params.toString()}`
        );

        const records = Array.isArray(result.data) ? result.data : [];
        const latestRecords = getLatestRecords(records);

        // وضعیت پیش‌فرض دانش‌آموزی که رکورد ندارد: حاضر
        students.forEach(student => {
            const button = findButton(student.name);
            if (!button) return;

            const record = latestRecords.get(
                normalizeName(student.name)
            );

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

    const isAbsent = button.classList.contains("absent");
    const newStatus = isAbsent ? "حاضر" : "غایب";

    try {
        await apiRequest(API_URL, {
            method: "POST",
            body: JSON.stringify({
                student_name: student.name,
                class_name: student.className,
                status: newStatus,
                attendance_date: getToday()
            })
        });

        if (newStatus === "غایب") {
            setButtonAbsent(button);
            showMessage(`⚫ ${student.name} غایب شد`);
        } else {
            setButtonPresent(button);
            showMessage(`🟢 ${student.name} حاضر شد`);
        }

        updateCounts();

        // دریافت وضعیت نهایی از سرور
        await loadTodayAttendance();
    } catch (error) {
        console.error("خطا در ثبت حضور و غیاب:", error);
        showMessage("❌ ثبت وضعیت انجام نشد");
    } finally {
        button.dataset.processing = "false";
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

async function refreshAttendance() {
    if (isRefreshing) return;

    isRefreshing = true;

    try {
        await loadTodayAttendance();
    } finally {
        isRefreshing = false;
    }
}

// تشخیص تغییر روز
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

// همگام‌سازی هنگام بازگشت به صفحه
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
