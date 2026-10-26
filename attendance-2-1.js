
const API_URL = "https://berandil.ir/farakhan-api/attendance.php";
const className = "دوم-1";

const students = [
    { name: "رادمان احمدی طباطبایی", className: "دوم-1" },
    { name: "آراد بزرگی", className: "دوم-1" },
    { name: "آراد ثبوتی", className: "دوم-1" },
    { name: "رادمان حیدری", className: "دوم-1" },
    { name: "هیراد حسنی", className: "دوم-1" },
    { name: "شنتیا درویشی", className: "دوم-1" },
    { name: "امیررضا دوادانگه", className: "دوم-1" },
    { name: "رایان رادمنش", className: "دوم-1" },
    { name: "رامان رحیمی", className: "دوم-1" },
    { name: "رهام صناعت گر", className: "دوم-1" },
    { name: "سامیار طاهرزاده", className: "دوم-1" },
    { name: "شاهان علی آبادی", className: "دوم-1" },
    { name: "بردیا فاضل", className: "دوم-1" },
    { name: "یونا فیض دار", className: "دوم-1" },
    { name: "آرتا قلخانی", className: "دوم-1" },
    { name: "نیما کاکاسلطانی", className: "دوم-1" },
    { name: "ویهان لک", className: "دوم-1" },
    { name: "ارسلان معینی", className: "دوم-1" },
    { name: "ماهور منصوری", className: "دوم-1" },
    { name: "نیهاد نجاری", className: "دوم-1" },
    { name: "یونا هاتف", className: "دوم-1" }
];

const studentsContainer = document.getElementById("studentsContainer");
const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const todayDate = document.getElementById("todayDate");
const message = document.getElementById("message");

let currentAttendanceDay = getToday();
let isLoadingAttendance = false;

const studentButtons = new Map();

// تاریخ ایران
function getToday() {
    const parts = new Intl.DateTimeFormat("en-US", {
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

// نمایش تاریخ فارسی
function showDate() {
    if (!todayDate) return;

    todayDate.textContent = new Date().toLocaleDateString("fa-IR", {
        timeZone: "Asia/Tehran",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

// نمایش پیام
function showMessage(text) {
    if (!message) return;

    message.textContent = text;
    message.classList.add("show");

    clearTimeout(window.messageTimer);

    window.messageTimer = setTimeout(() => {
        message.classList.remove("show");
    }, 2500);
}

// یکسان‌سازی نام فارسی
function normalizeStudentName(name) {
    return String(name ?? "")
        .normalize("NFC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\u200C/g, "")
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\s+/g, " ")
        .trim();
}

// درخواست به هاست
async function apiRequest(method = "GET", params = {}, body = null) {
    let url = API_URL;

    if (method === "GET") {
        url += `?${new URLSearchParams(params).toString()}`;
    }

    const options = {
        method,
        headers: {
            "Accept": "application/json"
        }
    };

    if (method !== "GET") {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body || {});
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`خطای سرور: ${response.status}`);
    }

    const result = await response.json();

    if (result.success === false) {
        throw new Error(result.message || "درخواست ناموفق بود.");
    }

    return result;
}

// ساخت دکمه‌های دانش‌آموزان
function createStudents() {
    if (!studentsContainer) return;

    studentsContainer.innerHTML = "";
    studentButtons.clear();

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

        studentButtons.set(
            normalizeStudentName(student.name),
            button
        );
    });

    if (totalCount) {
        totalCount.textContent = students.length;
    }

    updateCounts();
}

// پیدا کردن دکمه دانش‌آموز
function findButton(name) {
    return studentButtons.get(normalizeStudentName(name)) || null;
}

// وضعیت غایب
function setButtonAbsent(button) {
    if (!button) return;

    button.classList.remove("present");
    button.classList.add("absent");

    const status = button.querySelector(".student-status");

    if (status) status.textContent = "غایب";
}

// وضعیت حاضر
function setButtonPresent(button) {
    if (!button) return;

    button.classList.remove("absent");
    button.classList.add("present");

    const status = button.querySelector(".student-status");

    if (status) status.textContent = "حاضر";
}

// انتخاب آخرین رکورد هر دانش‌آموز
function getLatestRecords(records) {
    const latestRecords = new Map();

    records.forEach(record => {
        const key = normalizeStudentName(record.student_name);
        const existing = latestRecords.get(key);

        if (!existing) {
            latestRecords.set(key, record);
            return;
        }

        const currentTime = Date.parse(record.updated_at || "") || 0;
        const existingTime = Date.parse(existing.updated_at || "") || 0;

        if (
            currentTime > existingTime ||
            (
                currentTime === existingTime &&
                Number(record.id || 0) > Number(existing.id || 0)
            )
        ) {
            latestRecords.set(key, record);
        }
    });

    return latestRecords;
}

// دریافت وضعیت روز جاری از هاست
async function loadTodayAttendance(options = {}) {
    if (isLoadingAttendance) return;

    isLoadingAttendance = true;

    try {
        const today = getToday();

        const result = await apiRequest("GET", {
            class_name: className,
            date: today
        });

        // پاسخ روز قبل را اعمال نکن
        if (today !== getToday()) return;

        const records = Array.isArray(result.data) ? result.data : [];
        const latestRecords = getLatestRecords(records);

        students.forEach(student => {
            const button = findButton(student.name);

            if (!button || button.dataset.processing === "true") {
                return;
            }

            // وضعیت پیش‌فرض: حاضر
            setButtonPresent(button);

            const record = latestRecords.get(
                normalizeStudentName(student.name)
            );

            if (!record) return;

            if (record.status === "غایب") {
                setButtonAbsent(button);
            } else if (record.status === "حاضر") {
                setButtonPresent(button);
            }
        });

        updateCounts();

        if (options.showSuccess) {
            showMessage("اطلاعات حضور و غیاب به‌روز شد.");
        }
    } catch (error) {
        console.error("خطا در دریافت حضور و غیاب:", error);

        if (options.showError) {
            showMessage("❌ دریافت اطلاعات از سرور ناموفق بود.");
        }
    } finally {
        isLoadingAttendance = false;
    }
}

// ثبت وضعیت روی هاست
async function toggleAttendance(student, button) {
    if (
        !button ||
        button.disabled ||
        button.dataset.processing === "true"
    ) {
        return;
    }

    const previousStatus = button.classList.contains("absent")
        ? "غایب"
        : "حاضر";

    const newStatus = previousStatus === "غایب"
        ? "حاضر"
        : "غایب";

    const today = getToday();

    button.dataset.processing = "true";
    button.disabled = true;

    try {
        await apiRequest("POST", {}, {
            student_name: student.name,
            class_name: className,
            status: newStatus,
            attendance_date: today
        });

        if (today !== getToday()) {
            showMessage("تاریخ تغییر کرده است؛ وضعیت روز جدید بررسی می‌شود.");
            return;
        }

        if (newStatus === "غایب") {
            setButtonAbsent(button);
            showMessage(`⚫ ${student.name} غایب شد`);
        } else {
            setButtonPresent(button);
            showMessage(`🟢 ${student.name} حاضر شد`);
        }
    } catch (error) {
        console.error("خطا در ثبت حضور و غیاب:", error);

        // بازگرداندن وضعیت قبلی در صورت خطا
        if (previousStatus === "غایب") {
            setButtonAbsent(button);
        } else {
            setButtonPresent(button);
        }

        showMessage("❌ ثبت وضعیت انجام نشد؛ اتصال سرور را بررسی کنید.");
    } finally {
        delete button.dataset.processing;
        button.disabled = false;

        updateCounts();

        if (today !== getToday()) {
            checkAttendanceDayChange();
        } else {
            loadTodayAttendance();
        }
    }
}

// محاسبه آمار
function updateCounts() {
    let absent = 0;

    students.forEach(student => {
        const button = findButton(student.name);

        if (button && button.classList.contains("absent")) {
            absent++;
        }
    });

    const present = students.length - absent;

    if (totalCount) totalCount.textContent = students.length;
    if (presentCount) presentCount.textContent = present;
    if (absentCount) absentCount.textContent = absent;
}

// بررسی تغییر روز ایران
function checkAttendanceDayChange() {
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

    loadTodayAttendance({
        showError: true
    });
}

// راه‌اندازی اولیه
showDate();
createStudents();

loadTodayAttendance({
    showError: true
});

// همگام‌سازی خودکار هر ۵ ثانیه
setInterval(() => {
    checkAttendanceDayChange();
    loadTodayAttendance();
}, 5000);

// همگام‌سازی هنگام بازگشت به صفحه
window.addEventListener("focus", () => {
    checkAttendanceDayChange();
    showDate();

    loadTodayAttendance({
        showError: true
    });
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        checkAttendanceDayChange();
        showDate();

        loadTodayAttendance({
            showError: true
        });
    }
});
