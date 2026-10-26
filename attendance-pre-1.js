
const API_URL = "https://berandil.ir/farakhan-api/attendance.php";
const className = "پیش-1";

const students = [
    { name: "شهراد اسماعیل‌زاده", className },
    { name: "رادمهر ابراهیمی", className },
    { name: "آرتا ایرانشاهی", className },
    { name: "مهراد بهشتی مهر", className },
    { name: "رایبد بیکی", className },
    { name: "رایان حسنی", className },
    { name: "رهام دانشی", className },
    { name: "آرمان صفری", className },
    { name: "علی فارسی", className },
    { name: "کارن فرجی", className },
    { name: "راهین قریب", className },
    { name: "رادوین کلانتری", className },
    { name: "شاهان محمدی زاده", className },
    { name: "سام کبوتان", className }
];

const studentsContainer = document.getElementById("studentsContainer");
const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const todayDate = document.getElementById("todayDate");
const message = document.getElementById("message");

let currentAttendanceDay = getToday();
let isLoadingAttendance = false;
let messageTimer = null;

const studentButtons = new Map();

// تاریخ روز جاری
function getToday() {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// نمایش تاریخ فارسی
function showDate() {
    if (!todayDate) return;

    todayDate.textContent = new Date().toLocaleDateString("fa-IR", {
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

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        message.classList.remove("show");
    }, 2500);
}

// یکسان‌سازی نام دانش‌آموزان فارسی
function normalizeStudentName(name) {
    return String(name ?? "")
        .normalize("NFC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\u200C/g, "")
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\s+/g, "")
        .trim();
}

// درخواست به API هاست
async function apiRequest(method, params = {}, body = null) {
    const url = new URL(API_URL);

    if (method === "GET") {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }

    const options = {
        method,
        headers: {
            Accept: "application/json"
        }
    };

    if (method === "POST") {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("پاسخ سرور معتبر نیست.");
    }

    if (!response.ok || !result.success) {
        throw new Error(result.message || "ارتباط با سرور ناموفق بود.");
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

    updateCounts();
}

// پیدا کردن دکمه دانش‌آموز
function findButton(name) {
    return studentButtons.get(normalizeStudentName(name)) || null;
}

// تغییر وضعیت به غایب
function setButtonAbsent(button) {
    if (!button) return;

    button.classList.remove("present");
    button.classList.add("absent");

    const status = button.querySelector(".student-status");

    if (status) status.textContent = "غایب";
}

// تغییر وضعیت به حاضر
function setButtonPresent(button) {
    if (!button) return;

    button.classList.remove("absent");
    button.classList.add("present");

    const status = button.querySelector(".student-status");

    if (status) status.textContent = "حاضر";
}

// اعمال رکورد دریافتی از هاست
function applyRecord(record) {
    if (
        !record ||
        record.class_name !== className ||
        record.attendance_date !== getToday()
    ) {
        return;
    }

    const button = findButton(record.student_name);

    if (!button || button.dataset.processing === "true") {
        return;
    }

    if (record.status === "غایب") {
        setButtonAbsent(button);
    } else if (record.status === "حاضر") {
        setButtonPresent(button);
    }

    updateCounts();
}

// دریافت وضعیت روز جاری
async function loadTodayAttendance(options = {}) {
    if (isLoadingAttendance) return;

    isLoadingAttendance = true;

    try {
        const today = getToday();

        const result = await apiRequest("GET", {
            class_name: className,
            date: today
        });

        // جلوگیری از اعمال پاسخ مربوط به روز گذشته
        if (today !== getToday()) return;

        const records = Array.isArray(result.data)
            ? result.data
            : [];

        // انتخاب آخرین رکورد هر دانش‌آموز
        const latestRecords = new Map();

        records.forEach(record => {
            if (
                record.class_name !== className ||
                record.attendance_date !== today
            ) {
                return;
            }

            const key = normalizeStudentName(record.student_name);
            const existing = latestRecords.get(key);

            if (!existing) {
                latestRecords.set(key, record);
                return;
            }

            const newTime = Date.parse(record.updated_at || "") || 0;
            const oldTime = Date.parse(existing.updated_at || "") || 0;

            if (newTime > oldTime) {
                latestRecords.set(key, record);
            }
        });

        // بازسازی وضعیت دانش‌آموزان از اطلاعات سرور
        students.forEach(student => {
            const button = findButton(student.name);

            if (!button || button.dataset.processing === "true") {
                return;
            }

            setButtonPresent(button);

            const record = latestRecords.get(
                normalizeStudentName(student.name)
            );

            if (record) {
                if (record.status === "غایب") {
                    setButtonAbsent(button);
                } else if (record.status === "حاضر") {
                    setButtonPresent(button);
                }
            }
        });

        updateCounts();

        if (options.showSuccess) {
            showMessage("اطلاعات حضور و غیاب به‌روز شد.");
        }

    } catch (error) {
        console.error("خطا در دریافت حضور و غیاب پیش-1:", error);

        if (options.showError) {
            showMessage("❌ دریافت اطلاعات از هاست ناموفق بود.");
        }

    } finally {
        isLoadingAttendance = false;
    }
}

// ثبت وضعیت دانش‌آموز
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
            class_name: student.className,
            status: newStatus,
            attendance_date: today
        });

        // از نمایش نتیجه روز قبل در روز جدید جلوگیری می‌کنیم
        if (today !== getToday()) {
            showMessage("تاریخ تغییر کرده است؛ اطلاعات روز جدید بررسی می‌شود.");
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

        // در صورت خطا، وضعیت قبلی حفظ می‌شود
        if (previousStatus === "غایب") {
            setButtonAbsent(button);
        } else {
            setButtonPresent(button);
        }

        showMessage("❌ ثبت وضعیت انجام نشد؛ اتصال هاست را بررسی کنید.");

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

// محاسبه تعداد حاضر و غایب
function updateCounts() {
    let absent = 0;

    students.forEach(student => {
        const button = findButton(student.name);

        if (button && button.classList.contains("absent")) {
            absent++;
        }
    });

    if (totalCount) totalCount.textContent = students.length;
    if (absentCount) absentCount.textContent = absent;
    if (presentCount) presentCount.textContent = students.length - absent;
}

// بررسی تغییر روز
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

// همگام‌سازی دوره‌ای با هاست
setInterval(() => {
    checkAttendanceDayChange();
    loadTodayAttendance();
}, 5000);

// به‌روزرسانی پس از بازگشت به صفحه
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
