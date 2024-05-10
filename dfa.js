function buildTransitionTable(patterns) {
  let alphabets = getUniqueAlphabets(patterns);
  let transitionTable = {};
  let newState = 1;
  let acceptState = [];

  for (let pattern of patterns) {
    let state = 0;
    for (let char of pattern) {

      // Intialized the transition table if it is not defined
      if (!transitionTable[state]) {
        transitionTable[state] = {};
      }
      let nextState = transitionTable[state][char];

      // If the next state is undefined, create a new state
      if (nextState === undefined) {
        transitionTable[state][char] = newState;
        state = newState;
        newState++;
      } else {
        state = nextState;
      }
    }
    acceptState.push(state);
  }
  
  let newTransitionTable = postProcessTable(transitionTable, alphabets, acceptState);

  return [newTransitionTable, alphabets, acceptState];
}

function run(transitionTable, text) {
  let state = 0
  let history = []
  for (let index = 0; index < text.length; index++) {
    // Skip newline character
    if(text[index] == "\n"){
      history.push(state);
      continue;
    }
    history.push(state);
    state = transitionTable?.[state]?.[text[index]] ?? 0;
  }

  return history;
}

// Utility functions
function getUniqueAlphabets(pattern) {
  let alphabets = new Set();
  for (let p of pattern) {
    for (let char of p) {
      alphabets.add(char);
    }
  }
  return alphabets;
}

function postProcessTable(transitionTable, alphabets, acceptState) {

  // Append the value to other alphabets
  for (let key in transitionTable) {
    for (let char of alphabets) {
      if (transitionTable[key][char] === undefined) {
        transitionTable[key][char] = 0;
      }
    }
  }
  let updatedTransitionTable = {...transitionTable};

  for (let i = 0; i < Object.keys(transitionTable).length + 2; i++) {
    if (!(i in updatedTransitionTable)) {
      updatedTransitionTable[i] = {};
      alphabets.forEach(char => {
        updatedTransitionTable[i][char] = 0;
      });
    }
  }

  // Sort the transition table by keys
  let sortedTransitionTable = Object.fromEntries(
    Object.entries(updatedTransitionTable).sort(([a], [b]) => a - b)
  );
  
  return sortedTransitionTable;
}

function checkIfAlphaNumeric(char) {
  return /^[a-zA-Z0-9]+$/.test(char);
}

function getPositions(patterns, history, acceptState, text, exact) {
  let positions = {};
  let endIndex = 0;
  
  for (let index = history.length - 1; index >= 0; index--) {
    let char = history[index];
    
    if (acceptState.includes(char) && endIndex === 0) {
      endIndex = index;
    }
  
    if (endIndex !== 0 && char === 0) {
      let startIndex = index;
      // Check if the start index and end index are part of a word
      if(exact && ((startIndex > 0 && checkIfAlphaNumeric(text[startIndex - 1]) || (endIndex < text.length - 1 && checkIfAlphaNumeric(text[endIndex]))) )){
        endIndex = 0;
        continue;
      }
      let substring = text.substring(startIndex, endIndex).replace(/\n/g, ''); // Replace newline with space
      if (substring in positions) {
        positions[substring].push([startIndex, endIndex]);
      } else {
        positions[substring] = [[startIndex, endIndex]];
      }
      endIndex = 0;
    }
  }

  // Sort positions based on line number
  for (let word in positions) {
    positions[word].sort((a, b) => a[0]- b[0]);
  }
  
  for (let word of patterns) {
    // Ensure positions[word] is initialized as an array
    if (!(word in positions)) {
      positions[word] = [];
      positions[word].push(null);
    }
  }

  // Step 1: Extract all keys and sort them alphabetically
  let sorted_positions = Object.keys(positions).sort();

  // Step 2: Create a new object with sorted keys
  let word_positions = {};

  // Step 3 and 4: Copy values associated with each key
  sorted_positions.forEach(key => {
    word_positions[key] = positions[key];
  });

  return word_positions;
}

function getOccurrences(positions) {
  let occurrences = {};

  // Iterate through each word in the positions object
  for (let word in positions) {
    // If positions are null, set occurrences to 0
    if (positions[word][positions[word].length - 1] === null) {
      occurrences[word] = 0;
    } else {
      // Count the number of occurrences
      let count = positions[word].length;
      occurrences[word] = count;
    }
  }

  return occurrences;
}

function getStatus(occurrences) {
    // Check if every occurrence has more than one word
    let allAccepted = true;
    for (let key in occurrences) {
      if (occurrences[key] < 1) {
        allAccepted = false;
        break;
      }
    }
  // If every occurrence has more than one word, set the status to "accepted"
  let status = allAccepted ? "Accepted" : "Rejected";
  let status_text = `<div style="font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif; font-size: x-large; margin-bottom: 8px">Status: `;
  status_text += status == "Accepted" ? `<span style="background-color: #a5d357; border-radius: 6px; padding: 5px; margin: 8px;">${status}</span>` : `<span style="background-color: #df372f; border-radius: 6px; padding: 3px; margin: 8px;">${status}</span>`;
  status_text += `</div>`;
  document.getElementById("status").innerHTML = status_text;
}

function displayPositions(positions, text) {
  let position_text = '';

  // Iterate through each word in the positions object
  for (let word in positions) {
    position_text += `<strong>${word}:</strong>` + " is found at position: <br>";
    
    // Check if positions for the word are null
    if (positions[word][positions[word].length - 1] === null) {
      position_text += '-';
    } else {
      // Iterate through each occurrence of the word
      positions[word].forEach(position => {
        position_text += `<li>Start Index: ${position[0]}, End Index: ${position[1]}</li>`;
      });
    }

    position_text += '<br>';
  }

  document.getElementById("positions").innerHTML = position_text;
}

function displayOccurrences(occurrences) {
  //This part prints the count of occurrence for each substring
  var occurrence_text = "";
  for (var key in occurrences) {
      occurrence_text += key + " : " + occurrences[key] + " founds<br>";
  }
  document.getElementById("occurrences").innerHTML = occurrence_text;
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////


function clearResult(){
  document.getElementById('fileContent').value = originalFileContent;
  document.getElementById("occurrences").innerHTML = "";
  document.getElementById("positions").innerHTML = "";
  document.getElementById("status").innerHTML = `<div style="font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif; font-size: x-large; margin-bottom: 8px">Status: </div>`;
}

function highlightText(originalText, positions) {
  let highlighIndexes = [];
  for (const key in positions) {
    for (const range of positions[key]) {
      highlighIndexes.push(range);
    }
  }

  highlighIndexes.sort((a, b) => b[0]- a[0]);
  for (const [fromIndex, toIndex] of highlighIndexes) {
    const before = originalText.substring(0, fromIndex);
    const highlight = '<span style="background-color: yellow">' + originalText.substring(fromIndex, toIndex) + '</span>';
    const after = originalText.substring(toIndex, originalText.length);
    originalText = before + highlight + after;
  }

  return originalText;
}

const checkbox = document.getElementById('myCheckbox');
let exactMatch = false;

checkbox.addEventListener('change', function() {
  if (this.checked) {
    exactMatch = true;
  } else {
    exactMatch = false;
  }
  stimulateDFA()
});

// This is the main function
// This function is called when the user clicks the button or types in the input field
function stimulateDFA(){
  clearResult();

  // Retrive and Process Input
  let pattern = document.getElementById('patterns').value;
  if (!pattern || pattern == "") {
    document.getElementById('fileContent').innerHTML = originalFileContent;
    return;
  }
  if(pattern[pattern.length - 1] === ','){
    pattern = pattern.slice(0, -1);
  }
  pattern = pattern.split(',')
  pattern = pattern.map(p => p.trim());
  let text = originalFileContent;
  text = text.replace(/([^\s])\r\n/g, '$1 \r\n');
  text = text.replace(/\r\n/g, '\n');

  // Run DFA 
  let [transitionTable, alphabets, acceptState] = buildTransitionTable(pattern);
  let history = run(transitionTable, text);

  // The fourth agument is to check if the match is exact or not
  // Example
  // If you search for Malay, it will ignore the Malay in Malaysia
  // Which means the "Malay" in Malaysia will NOT BE HIGHLIGHTED
  let charPositions = getPositions(pattern, history, acceptState, text, exactMatch);
  let occurrences = getOccurrences(charPositions);

  // Display Result
  getStatus(occurrences);
  displayPositions(charPositions, text);
  displayOccurrences(occurrences);
  new_text = highlightText(text, charPositions);
  document.getElementById('fileContent').innerHTML = new_text;
}


// Below is for retriving data for UI purpose
var input = document.getElementById("patterns");
var originalFileContent;

// Execute a function when the user presses a key on the keyboard
input.addEventListener("keypress", function(event) {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    event.preventDefault();
    stimulateDFA();
  }
});


document.getElementById('openFile').addEventListener('change', function(event) {

  clearResult();
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
      const fileContent = e.target.result;
      document.getElementById('fileContent').innerHTML = fileContent;
      originalFileContent = fileContent;
  };

  reader.readAsText(file);
  fileName.innerHTML = file.name;
	fileSize.innerHTML = (file.size/1024).toFixed(1) + " KB";
	uploadedFile.style.cssText = "display: flex;";
	progressBar.style.width = 0;
	fileFlag = 0;

  homeFormRow.style.display = "none";
  formContainer.style.display = "block";
  occRow.style.display = "block";
  posRow.style.display = "block";
  homePageRow.style.display = "none";
  resultRow.style.display = "block";
  document.getElementById("status").innerHTML = `<div style="font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif; font-size: x-large; margin-bottom: 8px">Status: </div>`;
  resultContainer.style.backgroundImage = "none";
  resultContainer.style.height = "800px";
  resultContainer.style.paddingTop = "0px";
  resultContainer.style.paddingLeft = "0px";
  resultContainerRow.style.marginTop = "70px";
  resultContainerRow.style.height = "800px";
});

document.getElementById('changeFile').addEventListener('change', function(event) {
  
  clearResult();
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
      const fileContent = e.target.result;
      document.getElementById('fileContent').innerHTML = fileContent;
      originalFileContent = fileContent;
  };

  reader.readAsText(file);
  fileName.innerHTML = file.name;
	fileSize.innerHTML = (file.size/1024).toFixed(1) + " KB";
	uploadedFile.style.cssText = "display: flex;";
	progressBar.style.width = 0;
	fileFlag = 0;
});

document.addEventListener("DOMContentLoaded", function () {
  const occRow = document.getElementById("occRow");
  const posRow = document.getElementById("posRow");
  const resultContainer = document.getElementById("resultContainer");
  const resultContainerRow = document.getElementById("resultContainerRow");
  const homeFormRow = document.getElementById("homeFormRow");
  const homeFormContainer = document.getElementById("homeFormContainer");
  const formContainer = document.getElementById("formContainer");
  const homeFileContainer = document.getElementById("homeFileContainer");
  const homePageRow = document.getElementById("homePageRow");
  const resultRow = document.getElementById("resultRow");

  formContainer.style.display = "none";
  occRow.style.display = "none";
  posRow.style.display = "none";
  resultRow.style.display = "none";
  resultContainer.style.backgroundImage = "linear-gradient(to bottom right, #d7d6f4, #9d9fe4, #e3e6f5)";
  resultContainer.style.height = "600px";
  resultContainer.style.paddingTop = "70px";
  resultContainer.style.paddingLeft = "50px";
  resultContainer.style.marginTop = "0px";
  resultContainerRow.style.marginTop = "50px";
  homeFileContainer.style.backgroundColor = "transparent";
});

var isAdvancedUpload = function() {
  var div = document.createElement('div');
  return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
}();

let draggableFileArea = document.getElementById("draggableFileArea");
let browseFileText = document.querySelector(".browse-files");
let uploadIcon = document.querySelector(".upload-icon");
let dragDropText = document.querySelector(".dynamic-message");
let fileInput = document.querySelector("input");
let cannotUploadMessage = document.querySelector(".cannot-upload-message");
let cancelAlertButton = document.querySelector(".cancel-alert-button");
let uploadedFile = document.querySelector(".file-block");
let fileName = document.getElementById("fileName");
let fileSize = document.getElementById("fileSize");
let progressBar = document.querySelector(".progress-bar");
let uploadButton = document.querySelector(".upload-button");
let fileFlag = 0;

cancelAlertButton.addEventListener("click", () => {
	cannotUploadMessage.style.cssText = "display: none;";
});

if(isAdvancedUpload) {
	["drag", "dragstart", "dragend", "dragover", "dragenter", "dragleave", "drop"].forEach( evt => 
		draggableFileArea.addEventListener(evt, e => {
			e.preventDefault();
			e.stopPropagation();
		})
	);

	["dragover", "dragenter"].forEach( evt => {
		draggableFileArea.addEventListener(evt, e => {
			e.preventDefault();
			e.stopPropagation();
			uploadIcon.innerHTML = 'file_download';
			dragDropText.innerHTML = 'Drop your file here!';
		});
	});

	draggableFileArea.addEventListener("drop", e => {
    clearResult();
		uploadIcon.innerHTML = 'check_circle';
		dragDropText.innerHTML = 'File Dropped Successfully!';
		document.querySelector(".label").innerHTML = `drag & drop or <span class="browse-files"> <input type="file" id="openFile" class="default-file-input" style=""/> <span class="browse-files-text" style="top: -23px; left: -20px;"> browse file</span> </span>`;
    
		let files = e.dataTransfer.files;
    const file = files[0]; // Get the dropped file
    const reader = new FileReader();

    reader.onload = function(e) {
      const fileContent = e.target.result; // Read the file content
      document.getElementById('fileContent').innerHTML = fileContent; // Display the file content
      originalFileContent = fileContent;
    };

    reader.readAsText(file); // Read the dropped file as text

    fileName.innerHTML = file.name;
    fileSize.innerHTML = (file.size/1024).toFixed(1) + " KB";
    uploadedFile.style.cssText = "display: flex;";
    progressBar.style.width = 0;
    fileFlag = 0;

    homeFormRow.style.display = "none";
    formContainer.style.display = "block";
    occRow.style.display = "block";
    posRow.style.display = "block";
    homePageRow.style.display = "none";
    resultRow.style.display = "block";
    document.getElementById("status").innerHTML = `<div style="font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif; font-size: x-large; margin-bottom: 8px">Status: </div>`;
    resultContainer.style.backgroundImage = "none";
    resultContainer.style.height = "800px";
    resultContainer.style.paddingTop = "0px";
    resultContainer.style.paddingLeft = "0px";
    resultContainerRow.style.marginTop = "70px";
    resultContainerRow.style.height = "800px";
	});
}