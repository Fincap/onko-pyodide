onkoInit = `
def pydicom_init(*args):
	import pydicom
	print("PyDicom initialized")

global dataset_input
global current_dataset

import micropip
micropip.install('pydicom').then(pydicom_init)
`;

loadDicom = `
import pydicom
from js import document

with open("dicomfile.dcm", "wb") as f:
	f.write(dataset_input.tobytes())

current_dataset = pydicom.dcmread("dicomfile.dcm")
print(current_dataset)

document.getElementById("patientname").innerHTML = current_dataset.PatientName
document.getElementById("patientid").innerHTML = current_dataset.PatientID
document.getElementById("patientsex").innerHTML = current_dataset.PatientSex
document.getElementById("patientdob").innerHTML = current_dataset.PatientBirthDate
`

displayDicom = `
import numpy
import matplotlib.pyplot as plt

'''const_pixel_dims = (int(current_dataset.Rows), int(current_dataset.Columns), 1)
const_pixel_spacing = (float(current_dataset.PixelSpacing[0]), float(current_dataset.PixelSpacing[1]), float(current_dataset.SliceThickness))

array_dicom = numpy.zeros(const_pixel_dims, dtype=current_dataset.pixel_array.dtype)'''

f = plt.figure()
plt.imshow(current_dataset.pixel_array, cmap=plt.cm.bone)

def create_root_element(self):
	return document.getElementById('dicomimage')

# This is replacing the create_root_element function in the base class of f.canvas with our version, so that it works outside of Iodide
f.canvas.create_root_element = create_root_element.__get__(create_root_element, f.canvas.__class__)
f.canvas.show()
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