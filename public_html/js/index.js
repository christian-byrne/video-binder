const BASE_URL = "http://127.0.0.1:5000";
const PLAYER = document.querySelector("video");

const collapseForm = (caller) => {
  caller.nextElementSibling.classList.toggle("collapsed");
};

const thumbnailNode = (video, options = {}) => {
  let li = document.createElement("li");

  let table = document.createElement("table");
  for (const [property, value] of Object.entries(video)) {
    let row = table.insertRow();
    let propCell = row.insertCell(0);
    propCell.innerHTML = property;
    let valCell = row.insertCell(1);
    valCell.innerHTML = value;
  }
  li.innerHTML = options.title;
  li.appendChild(table);
  li.addEventListener("click", () => {
    PLAYER.src = video.originalPath;
    setTimeout(() => {
      PLAYER.play();
    }, 400);
  });

  return li;
};

const displaySearchResults = (results) => {
  const outputContainer = document.querySelector("body > div:nth-of-type(3)");

  let ul = document.createElement("ul");
  for (const vid of results) {
    ul.appendChild(thumbnailNode(vid));
  }

  outputContainer.appendChild(ul);
};

const uploadVideo = () => {
  const ajaxOptions = {
    url: `${BASE_URL}/upload`,
    type: "POST",
    data: new FormData(document.querySelector("form#upload-video")),
    enctype: "multipart/form-data",
    processData: false,
    contentType: false,
    cache: false,
    timeout: 800000,
    success: () => {
      alert("Item listed");
      let inputs = document.querySelector("form").querySelectorAll("input");
      for (const node of inputs) {
        if (node.type !== "submit" && node.type !== "button") {
          node.value = "";
        }
      }
    },
  };
  $.ajax(ajaxOptions);
};

function searchVids(caller) {
  const ajaxOptions = {
    url: `${BASE_URL}/search`,
    type: "POST",
    data: new FormData(caller.parent),
    success: (videos) => {
      displaySearchResults(videos);
    },
  };
  $.ajax(ajaxOptions);
}

document.documentElement.addEventListener("click", (event) => {
  const caller = event.target;

  if (caller.id === "post-video" && caller.tagName === "BUTTON") {
    uploadVideo();
  } else if (caller.id === "search-videos" && caller.tagName === "BUTTON") {
    event.preventDefault();
    searchVids(caller);
  } else if (caller.id === "upload-video" && caller.tagName === "BUTTON") {
    collapseForm(caller);
    document.querySelector("button#post-video").classList.toggle("collapsed");
  } else if (caller.id === "search-video-btn" && caller.tagName === "BUTTON") {
    collapseForm(caller);
  }
});
