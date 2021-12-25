import { CourseSiteInfo } from "./model";

export function createPanMatrixBtn(): void {
  const topbar = document.getElementById("mastLogin");
  try {
    const btn = document.createElement('div');
    btn.className = "cs-panmatrix-btn";
    const body = document.createElement('button');
    body.textContent = "PanMatrix";
    btn.appendChild(body);

    const popup = buildPopup();

    btn.addEventListener('click', (ev) => onPanMatrixClick(popup));

    topbar?.appendChild(btn);
    topbar?.appendChild(popup);
  } catch (e) {
    console.log("could not launch Panmatrix.");
  }
}

function buildPopup(): HTMLDivElement {
  const popup = document.createElement('div');

  popup.appendChild(makeTimetable(
    [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ]
  ));

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

function extractDayFromLectureName(lectureName: string): {
  day: number // integer [0, 4], 0=mon, 4=fri
  period: number // integer [0, 4]
} | null {
  // TODO:
  throw "todo";
}

function makeTimetable(courses: (CourseSiteInfo | null)[][]): HTMLTableElement {
  const top = document.createElement('table');

  const th = document.createElement('th');
  // TODO: i18n
  const days = ["月", "火", "水", "木", "金"];
  for (let i=0; i<6; i++) {
    const td = document.createElement('td');
    if (i != 0) {
      td.textContent = days[i-1];
    }
    th.appendChild(td);
  }
  top.appendChild(th);

  for (let period=0; period<5; period++) {
    const tr = document.createElement('tr');

    const rowHeader = document.createElement('td');
    rowHeader.textContent = "" + (period+1);
    tr.appendChild(rowHeader);

    for (let day=0; day<5; day++) {
      const course = courses[day][period];

      const td = document.createElement('td');
      if (course !== null) {
        td.textContent = course.courseName as string;
      }
      tr.appendChild(td);
    }

    top.appendChild(tr);
  }

  return top;
}
