import { Assignment, AssignmentEntry, CourseSiteInfo } from "./model";
import { saveToLocalStorage } from "./storage";

export const nowTime = new Date().getTime();

function getDaysUntil(dt1: number, dt2: number): number {
  // 締め切りまでの日数を計算します
  let diff = (dt2 - dt1) / 1000;
  diff /= 3600 * 24;
  return diff;
}

function getTimeRemain(_remainTime: number): [number, number, number] {
  const day = Math.floor(_remainTime / (3600 * 24));
  const hours = Math.floor((_remainTime - day * 3600 * 24) / 3600);
  const minutes = Math.floor((_remainTime - (day * 3600 * 24 + hours * 3600)) / 60);
  return [day, hours, minutes];
}

function formatTimestamp(timestamp: number): string {
  const _date = new Date(timestamp * 1000);
  return _date.toLocaleDateString() + " " + _date.getHours() + ":" + ("00" + _date.getMinutes()).slice(-2);
}

function createCourseIDMap(courseSiteInfos: Array<CourseSiteInfo>): Map<string, string> {
  // 講義IDと講義名のMapを作る
  const courseIDMap = new Map<string, string>();
  for (const courseSiteInfo of courseSiteInfos) {
    courseIDMap.set(courseSiteInfo.courseID, courseSiteInfo.courseName);
  }
  return courseIDMap;
}

function isLoggedIn(): boolean {
  // ログインしているかどうかを返す
  const scripts = document.getElementsByTagName("script");
  let loggedIn = false;
  // @ts-ignore
  for (const script of scripts) {
    if (script.text.match('"loggedIn": true')) loggedIn = true;
  }
  return loggedIn;
}

function getSiteCourseID() {
  // 現在のページの講義IDを返す
  const url = location.href;
  let courseID = "";
  const reg = new RegExp("(https?://[^/]+)/portal/site/([^/]+)");
  if (url.match(reg)) {
    // @ts-ignore
    courseID = url.match(reg)[2];
  }
  return courseID;
}

function updateIsReadFlag(assignmentList: Array<Assignment>): void {
  const courseID = getSiteCourseID();
  const updatedAssignmentList = [];
  // TODO: 怪しい処理を見直す
  if (courseID && courseID.length >= 17) {
    for (const assignment of assignmentList) {
      if (assignment.courseSiteInfo.courseID === courseID) {
        updatedAssignmentList.push(new Assignment(assignment.courseSiteInfo, assignment.assignmentEntries, true));
      } else {
        updatedAssignmentList.push(assignment);
      }
    }
    saveToLocalStorage("TSkadaiList", updatedAssignmentList);
  }
}

function miniSakaiReady(): void {
  // ロード表示を切り替えて3本線表示にする
  const hamburger = document.getElementsByClassName("loader")[0];
  hamburger.className = "";
  hamburger.id = "hamburger";
  hamburger.textContent = "☰";
}

function convertArrayToKadai(arr: Array<any>): Array<Assignment>{
  const assignmentList = [];
  for (const i of arr) {
    const assignmentEntries = [];
    for (const e of i.assignmentEntries) {
      const entry = new AssignmentEntry(e.assignmentID, e.assignmentTitle, e.dueDateTimestamp, e.isMemo, e.isFinished, e.isQuiz ,e.assignmentDetail);
      entry.assignmentPage = e.assignmentPage;
      if (entry.dueDateTimestamp * 1000 > nowTime) assignmentEntries.push(entry);
    }
    assignmentList.push(new Assignment(new CourseSiteInfo(i.courseSiteInfo.courseID, i.courseSiteInfo.courseName), assignmentEntries, i.isRead))
  }
  return assignmentList;
}

function compareAndMergeKadaiList(oldAssignmentiList: Array<Assignment>, newAssignmentList: Array<Assignment>): Array<Assignment>{
  const mergedAssignmentList = [];

  // 最新の課題リストをもとにマージする
  for (const newAssignment of newAssignmentList){
    const idx = oldAssignmentiList.findIndex((oldAssignment: Assignment) => {
      return (oldAssignment.courseSiteInfo.courseID === newAssignment.courseSiteInfo.courseID)
    });

    // もし過去に保存した課題リストの中に講義IDが存在しない時
    if (idx === -1) {
      // 未読フラグを立ててマージ
      const isRead = newAssignment.assignmentEntries.length === 0;
      newAssignment.assignmentEntries.sort((a, b) => {
        return a.dueDateTimestamp - b.dueDateTimestamp;
      });
      mergedAssignmentList.push(new Assignment(newAssignment.courseSiteInfo, newAssignment.assignmentEntries, isRead));
    }
    // 過去に保存した課題リストの中に講義IDが存在する時
    else {
      // 未読フラグを引き継ぐ
      let isRead = oldAssignmentiList[idx].isRead;
      // 何も課題がない時は既読フラグをつける
      if (newAssignment.assignmentEntries.length === 0) isRead = true;

      let mergedAssignmentEntries = [];
      for (const newAssignmentEntry of newAssignment.assignmentEntries){
        // 新しく取得した課題が保存された課題一覧の中にあるか探す
        const oldAssignment = oldAssignmentiList[idx] as Assignment;
        const q = oldAssignment.assignmentEntries.findIndex((oldAssignmentEntry) => {
          return oldAssignmentEntry.assignmentID === newAssignmentEntry.assignmentID;
          }
        );
        // もしなければ新規課題なので未読フラグを立てる
        if (q === -1) {
          isRead = false;
          mergedAssignmentEntries.push(newAssignmentEntry);
        } else {
          const entry = new AssignmentEntry(
            newAssignmentEntry.assignmentID,
            newAssignmentEntry.assignmentTitle,
            newAssignmentEntry.dueDateTimestamp,
            newAssignmentEntry.isMemo,
            oldAssignment.assignmentEntries[q].isFinished,
            newAssignmentEntry.isQuiz,
            newAssignmentEntry.assignmentDetail
          );
          entry.assignmentPage = newAssignmentEntry.assignmentPage;
          mergedAssignmentEntries.push(entry);
        }
      }
      // 未読フラグ部分を変更してマージ
      mergedAssignmentEntries.sort((a, b) => {return a.dueDateTimestamp - b.dueDateTimestamp});
      mergedAssignmentList.push(new Assignment(newAssignment.courseSiteInfo, mergedAssignmentEntries, isRead));
    }
  }
  return mergedAssignmentList;
}

function mergeIntoKadaiList(targetAssignmentList: Array<Assignment>, newAssignmentList: Array<Assignment>): Array<Assignment>{
  const mergedAssignmentList = [];
  for (const assignment of targetAssignmentList){
    mergedAssignmentList.push(new Assignment(assignment.courseSiteInfo, assignment.assignmentEntries, assignment.isRead));
  }
  for (const newAssignment of newAssignmentList){
    const idx = targetAssignmentList.findIndex((assignment: Assignment) => {
      return newAssignment.courseSiteInfo.courseID === assignment.courseSiteInfo.courseID;
    });

    const mergedAssignment = mergedAssignmentList[idx] as Assignment;
    if (idx !== -1) {
      mergedAssignment.assignmentEntries = mergedAssignment.assignmentEntries.concat(newAssignment.assignmentEntries);
    } else {
      mergedAssignmentList.push(new Assignment(newAssignment.courseSiteInfo, newAssignment.assignmentEntries, true));
    }
  }
  return mergedAssignmentList;
}

function sortKadaiList(assignmentList: Array<Assignment>): Array<Assignment> {
  return Array.from(assignmentList).sort((a, b) => {
    if (a.closestDueDateTimestamp > b.closestDueDateTimestamp) return 1;
    if (a.closestDueDateTimestamp < b.closestDueDateTimestamp) return -1;
    return 0;
  });
}

function useCache(fetchedTime: number, cacheInterval: number): boolean{
  return (nowTime - fetchedTime) / 1000 <= cacheInterval;
}

function genUniqueStr(): string {
  return "m" + new Date().getTime().toString(16) + Math.floor(123456 * Math.random()).toString(16);
}

export {
  getDaysUntil,
  getTimeRemain,
  formatTimestamp,
  createCourseIDMap,
  isLoggedIn,
  miniSakaiReady,
  convertArrayToKadai,
  compareAndMergeKadaiList,
  updateIsReadFlag,
  useCache,
  genUniqueStr,
  mergeIntoKadaiList,
  sortKadaiList,
};
