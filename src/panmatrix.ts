import { CourseSiteInfo } from "./model";
import { courseIDList } from "./content_script";

export function createPanMatrixBtn(): void {
  const topbar = document.getElementById("mastLogin");
  try {
    const btn = document.createElement("div");
    btn.className = "cs-panmatrix-btn";
    const body = document.createElement("button");
    body.textContent = "PanMatrix";
    btn.appendChild(body);

    const popup = buildPopup();

    btn.addEventListener("click", (ev) => onPanMatrixClick(popup));

    topbar?.appendChild(btn);
    topbar?.appendChild(popup);
  } catch (e) {
    console.log("could not launch Panmatrix.");
    console.log(e);
  }
}

function buildPopup(): HTMLDivElement {
  const popup = document.createElement("div");

  const courses = courseIDList
    .map((course) => {
      if (course.courseName == null) return null;
      const dayAndPeriod = extractDayFromLectureName(course.courseName);
      if (dayAndPeriod == null) return null;
      return {
        day: dayAndPeriod.day,
        period: dayAndPeriod.period,
        data: course,
      };
    })
    .filter((c) => c != null) as {
    day: number;
    period: number;
    data: CourseSiteInfo;
  }[];
  const ttArray = arrangeLectures(courses);
  popup.appendChild(makeTimetable(ttArray));

  popup.classList.add("cs-panmatrix-body");
  popup.classList.add("cs-inactive");

  return popup;
}

let panMatrixIsActive = false;

function onPanMatrixClick(targetPopup: HTMLDivElement) {
  if (targetPopup.classList.contains("cs-inactive")) {
    targetPopup.classList.remove("cs-inactive");
  } else {
    targetPopup.classList.add("cs-inactive");
  }
}

function regexHeader() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const semester = 3 <= month && month < 9 ? "前期" : "後期";
  return year + semester;
}

const regexPattern = new RegExp("^\\[" + regexHeader() + "([月火水木金])([１２３４５])\\].*$");

const dayMap = new Map<string, number>();
dayMap.set("月", 0);
dayMap.set("火", 1);
dayMap.set("水", 2);
dayMap.set("木", 3);
dayMap.set("金", 4);

const periodMap = new Map<string, number>();
periodMap.set("１", 0);
periodMap.set("２", 1);
periodMap.set("３", 2);
periodMap.set("４", 3);
periodMap.set("５", 4);

function extractDayFromLectureName(lectureName: string): {
  day: number; // integer [0, 4], 0=mon, 4=fri
  period: number; // integer [0, 4]
} | null {
  const result = regexPattern.exec(lectureName);
  if (result == null) return null;
  if (result.length < 3) return null;

  const day = dayMap.get(result[1]);
  if (day == undefined) return null;
  const period = periodMap.get(result[2]);
  if (period == undefined) return null;

  return {
    day: day,
    period: period,
  };
}

function arrangeLectures<T>(data: { day: number; period: number; data: T }[]): (T | null)[][] {
  const result: (T | null)[][] = [];
  for (let day = 0; day < 5; day++) {
    const oneDay: (T | null)[] = [];
    for (let period = 0; period < 5; period++) {
      let found = false;
      for (const entry of data) {
        if (day === entry.day && period == entry.period) {
          oneDay.push(entry.data);
          found = true;
          break;
        }
      }
      if (!found) {
        oneDay.push(null);
      }
    }
    result.push(oneDay);
  }
  return result;
}

function makeTimetable(courses: (CourseSiteInfo | null)[][]): HTMLTableElement {
  console.log(courses);
  const top = document.createElement("table");
  top.classList.add("cs-panmatrix-table");

  const tr = document.createElement("tr");
  // TODO: i18n
  const days = ["月", "火", "水", "木", "金"];
  for (let i = 0; i < 6; i++) {
    const th = document.createElement("th");
    if (i != 0) {
      th.textContent = days[i - 1];
    }
    tr.appendChild(th);
  }
  top.appendChild(tr);

  for (let period = 0; period < 5; period++) {
    const tr = document.createElement("tr");

    const rowHeader = document.createElement("td");
    rowHeader.textContent = "" + (period + 1);
    tr.appendChild(rowHeader);

    for (let day = 0; day < 5; day++) {
      const course = courses[day][period];

      const td = document.createElement("td");
      if (course !== null) {
        td.textContent = course.courseName as string;
        td.addEventListener("click", (ev) => {
          window.location.href = "https://panda.ecs.kyoto-u.ac.jp/portal/site-reset/" + course.courseID;
        });
        td.classList.add("cs-clickable");
      }
      tr.appendChild(td);
    }

    top.appendChild(tr);
  }

  return top;
}
