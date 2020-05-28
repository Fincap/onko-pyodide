onkoInit = `
def pydicom_init(*args):
	import pydicom
	print("PyDicom initialized")

#def mpld3_init(*args):
#	import mpld3
#	print("mpld3 initialized")

global dataset_input
global current_dataset

import micropip
micropip.install('pydicom').then(pydicom_init)
#micropip.install('mpld3').then(mpld3_init)
`;

loadDicom = `
import pydicom
from js import document

with open("dicomfile.dcm", "wb") as f:
	f.write(dataset_input.tobytes())

current_dataset = pydicom.dcmread("dicomfile.dcm")

document.getElementById("patientname").innerHTML = current_dataset.PatientName
document.getElementById("patientid").innerHTML = current_dataset.PatientID
document.getElementById("patientsex").innerHTML = current_dataset.PatientSex
document.getElementById("patientdob").innerHTML = current_dataset.PatientBirthDate
`

displayDicom = `
import numpy
import matplotlib.pyplot as plt

f = plt.figure(frameon=False)
plt.imshow(current_dataset.pixel_array, cmap=plt.cm.bone)
plt.axis('off')

def create_root_element(self):
	return document.getElementById('dicomimage')

# There is currently an issue within pyodide which results in matplotlib graphs not showing outside an Iodide environment.
# This is replacing the create_root_element function in the base class of f.canvas with our version, so that it works outside of Iodide
f.canvas.create_root_element = create_root_element.__get__(create_root_element, f.canvas.__class__)
f.canvas.show()
plt.close(f)
`

onkoInitialized = false;
document.getElementById("uielements").style.display = "none";
document.getElementById("patientinfo").style.display = "none";

document.getElementById("fileupload").addEventListener('change', (event) => {
	if (!onkoInitialized) {
		console.log("OnkoDICOM has not completed initilization. Please try again later");
	} else {
		var input = event.target;
		var fileReader = new FileReader();
		fileReader.onload = () => {
			pyodide.globals.dataset_input = new Int8Array(fileReader.result);
			pyodide.runPython(loadDicom);
			document.getElementById("patientinfo").style.display = "block";
		}
		fileReader.readAsArrayBuffer(input.files[0]);
	}
});

document.getElementById("displaydcmimage").addEventListener('click', () => {
	if (!onkoInitialized) {
		console.log("OnkoDICOM has not completed initilization. Please try again later");
	} else {
		pyodide.runPython(displayDicom)
	}
});

window.languagePluginUrl = "/scripts/pyodide.js";
languagePluginLoader.then(() => {
	pyodide.loadPackage(['matplotlib', 'micropip']).then(() => {
		document.getElementById("status").innerHTML = "Python initialized. Initializing OnkoDICOM...";
		pyodide.runPythonAsync(onkoInit).then((output) => {
			onkoInitialized = true;
			document.getElementById("status").innerHTML = "OnkoDICOM initialized";
			document.getElementById("uielements").style.display = "block";
		});
	});
});