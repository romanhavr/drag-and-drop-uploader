const googleLogin = document.getElementById('google-login');
const dropArea = document.getElementById('drop-area');
const dropExtensions = document.getElementById('drop-extensions');
const preview = document.getElementById('preview');
const but = document.getElementById('but');
const result = document.getElementById('result');
const uploadedFiles = document.getElementById('uploaded');
const progress = document.getElementById('progress');

let files = [];
let token = '';
let GoogleAuth;
const url = 'https://www.googleapis.com/upload/drive/v3/files';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const discoveryUrl = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

function updateSigninStatus() {
  setSigninStatus();
};

// EventListener operations
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults);
  window.addEventListener(eventName, preventDefaults);
});

function preventDefaults (e) { e.preventDefault() };

window.addEventListener('dragenter', highlight);
window.addEventListener('dragover', highlight);

window.addEventListener('dragleave', unhighlight);
window.addEventListener('drop', unhighlight);
dropArea.addEventListener('drop', unhighlight);

dropArea.addEventListener('drop', handleDrop);

// Highlighting / unhighlighting of droparea
function highlight() {
  dropArea.classList.add('highlight');

  dropExtensions.style.animation = 'none';
  result.style.animation = 'none';
  result.innerHTML = '';

  window.removeEventListener('dragenter', highlight);
  window.removeEventListener('dragover', highlight)
}; 

function unhighlight() {
  dropArea.classList.remove('highlight');

  window.addEventListener('dragenter', highlight);
  window.addEventListener('dragover', highlight);
};

// Handling "drop" event
function handleDrop(e) {
  let newFiles = [];
  let repit;

  for (let i=0; i<e.dataTransfer.files.length; i++) {
    repit = false;
    if (files.length == 0) {
      newFiles.push(e.dataTransfer.files[i]);
    } else {
      for (let j=0; j<files.length; j++) { 
        if (files[j].name == e.dataTransfer.files[i].name) {
          repit = true
        }
      };
      if (!repit) {
        newFiles.push(e.dataTransfer.files[i])
      }
    }
  };

  for (let i=0; i<newFiles.length; i++) {
    if (newFiles[i].name.slice(-3) == 'jpg' ||
        newFiles[i].name.slice(-3) == 'png' ||
        newFiles[i].name.slice(-3) == 'gif' ||
        newFiles[i].name.slice(-3) == 'pdf' ||
        newFiles[i].name.slice(-3) == 'peg' &&
        newFiles[i].name.slice(-4) == 'jpeg') {
          files.push(newFiles[i]);
    } else {
      dropExtensions.style.animation = 'blink-red .5s step-end infinite alternate';
      result.style.color = 'black';
      result.style.animation = 'blink-red .5s step-end infinite alternate';
      result.innerHTML = '* only ".jpg", ".jpeg", ".png", "gif" or ".pdf" files can be uploaded.';
    }
  };
  
  preview.innerHTML = '';
  files.forEach(preloadPreviewFile)
};

// Handling "upload" button click
but.onclick = function () {
  handleFiles(files);
    
  let imgs = preview.querySelectorAll('img');
  for (let i = 0; i < imgs.length; i++) {
    preview.removeChild(imgs[i])
  };
  
  dropExtensions.style.animation = 'none';
  result.style.animation = 'none';
  result.innerHTML = '';
  progress.innerHTML = '(Uploading file(s)...)'
  files = []
}

function handleFiles(files) {
  files = [...files];
  files.forEach(uploadFile);
  files = []
};

function uploadFile(file) {

  let xhr = new XMLHttpRequest();
  let formData = new FormData();
  
  xhr.open('POST', url, true);
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.setRequestHeader('X-Upload-Content-Length', file.size);
  xhr.setRequestHeader('X-Upload-Content-Name', file.name);

  xhr.addEventListener('readystatechange', function() {
    if (xhr.readyState < 4) {
      progress.innerHTML = '(Uploading file(s)...)'
    }else if (xhr.readyState == 4 && xhr.status == 200) {
      previewFile(file);
      progress.innerHTML = '(Success uploading.)'
      gapi.client.drive.files.update({
        'fileId': JSON.parse(xhr.responseText).id,
        'name': file.name
      }).execute()
    }
    else if (xhr.readyState == 4 && xhr.status != 200) {
      result.innerHTML = `ERROR occured during upload. Error status: ${xhr.status} (${xhr.statusText})`
    }
  });

  formData.append("file", file, file.name);
  formData.append("upload_file", true);

  xhr.send(formData);
};

// Previewing dropped files
function preloadPreviewFile(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function() {
    let img = document.createElement('img');
    img.src = reader.result;
    preview.appendChild(img)
  }
};

// Previewing uploaded files
function previewFile(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function() {
    let img = document.createElement('img');
    img.src = reader.result;
    uploadedFiles.appendChild(img)
  }
};

// Google login logic
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
};

function initClient() {
  gapi.client.init({
      'apiKey': '___my_API_Key___',
      'discoveryDocs': [discoveryUrl],
      'clientId': '___my_client_ID___',
      'scope': SCOPE
  }).then(function () {
    GoogleAuth = gapi.auth2.getAuthInstance();
    GoogleAuth.isSignedIn.listen(updateSigninStatus);

    setSigninStatus();
  });
};

googleLogin.onclick = function() {
  if (GoogleAuth.isSignedIn.get()) {
    GoogleAuth.signOut();
  } else {
    GoogleAuth.signIn();
  }
};

function setSigninStatus() {
  const user = GoogleAuth.currentUser.get();
  token = user.Zi ? user.Zi.access_token : '';

  let isAuthorized = user.hasGrantedScopes(SCOPE);
  if (isAuthorized) {
    googleLogin.innerHTML = `Sign out <b><u>(`+user.w3.ofa+`)</u></b>`;
  } else {
    googleLogin.innerHTML = `Sign in your&nbsp;
                            <img src='images/logo-drive.png'>&nbsp;
                            Google account.`;
  }
};