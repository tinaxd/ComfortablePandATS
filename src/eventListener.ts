import { miniPandA } from "./dom";
import { loadFromStorage, saveToStorage } from "./storage";
import { Kadai, KadaiEntry } from "./kadai";
import { convertArrayToKadai } from "./utils";

let toggle = false;

function toggleSideNav() {
  if (toggle) {
    miniPandA.style.width = "0px";
    document.getElementById("cover")?.remove();
  } else {
    miniPandA.style.width = "300px";
    const cover = document.createElement("div");
    cover.id = "cover";
    document.getElementsByTagName("body")[0].appendChild(cover);
    cover.onclick = toggleSideNav;
  }
  toggle = !toggle;
}

function toggleKadaiTab() {
  const kadaiTab = document.querySelector(".kadai-tab");
  // @ts-ignore
  kadaiTab.style.display = "";
  const examTab = document.querySelector(".exam-tab");
  // @ts-ignore
  examTab.style.display = "none";
  const addMemoButton = document.querySelector(".plus-button");
  // @ts-ignore
  addMemoButton.style.display = "";
  const lastKadaiGetTime = document.querySelector(".kadai-time");
  // @ts-ignore
  lastKadaiGetTime.style.display = "";
}

function toggleExamTab() {
  const kadaiTab = document.querySelector(".kadai-tab");
  // @ts-ignore
  kadaiTab.style.display = "none";
  const examTab = document.querySelector(".exam-tab");
  // @ts-ignore
  examTab.style.display = "";
  const addMemoButton = document.querySelector(".plus-button");
  // @ts-ignore
  addMemoButton.style.display = "none";
  const lastKadaiGetTime = document.querySelector(".kadai-time");
  // @ts-ignore
  lastKadaiGetTime.style.display = "none";
  // loadExamfromStorage();
}

function toggleMemoBox() {
  const addMemoBox = document.querySelector('.addMemoBox');
  // @ts-ignore
  const toggleStatus = addMemoBox.style.display;
  if (toggleStatus === "") {
    // @ts-ignore
    addMemoBox.style.display = "none";
  }
  else { // @ts-ignore
    addMemoBox.style.display = "";
  }
}

async function toggleKadaiFinishedFlag(event: any) {
  // TODO: 済　にしてもいいかも
  const kadaiList: Array<Kadai> = convertArrayToKadai(await loadFromStorage("kadaiList"));
  const kadaiID = event.target.id;
  const updatedKadaiList = [];
  for (const kadai of kadaiList){
    const updatedKadaiEntries = [];
    for (const kadaiEntry of kadai.kadaiEntries){
      if (kadaiEntry.kadaiID === kadaiID) {
        const isFinished = kadaiEntry.isFinished;
        updatedKadaiEntries.push(
          new KadaiEntry(
            kadaiEntry.kadaiID,
            kadaiEntry.assignmentTitle,
            kadaiEntry.dueDateTimestamp,
            kadaiEntry.isMemo,
            !isFinished,
            kadaiEntry.assignmentDetail
          )
        );
      } else {
        updatedKadaiEntries.push(kadaiEntry)
      }
    }
    updatedKadaiList.push(new Kadai(kadai.lectureID, kadai.lectureName, updatedKadaiEntries, kadai.isRead));
  }
  console.log("見つけた", updatedKadaiList)
  saveToStorage("kadaiList", updatedKadaiList);
}

export { toggleSideNav, toggleKadaiTab, toggleExamTab, toggleMemoBox, toggleKadaiFinishedFlag };
