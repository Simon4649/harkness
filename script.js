document.addEventListener('DOMContentLoaded', () => {
  const harknessCanvas = document.getElementById('harknessDiagram');
  const harknessCtx = harknessCanvas.getContext('2d');
  const studentChartCanvas = document.getElementById('studentChart');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const addQuestionBtn = document.getElementById('addQuestionBtn');
  const addInsightBtn = document.getElementById('addInsightBtn');
  const addInteractionBtn = document.getElementById('addInteractionBtn');
  const importStudentListBtn = document.getElementById('importStudentListBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const addStudentBtn = document.getElementById('addStudentBtn');
  const removeStudentBtn = document.getElementById('removeStudentBtn');
  const uploadFileInput = document.getElementById('uploadFile');

  harknessCanvas.width = 600;
  harknessCanvas.height = 400;

  let students = [];
  let hoveredStudent = null;
  let selectedStudentForInteraction = null;
  let chartInstance = null;

  const interactionMap = new Map(); // Tracks interactions between student pairs

  // Render the Harkness diagram
  function renderHarknessDiagram() {
    harknessCtx.clearRect(0, 0, harknessCanvas.width, harknessCanvas.height);

    if (students.length === 0) {
      harknessCtx.fillStyle = '#666';
      harknessCtx.font = '18px Arial';
      harknessCtx.textAlign = 'center';
      harknessCtx.fillText(
        'No students added. Import a list or add students manually.',
        harknessCanvas.width / 2,
        harknessCanvas.height / 2
      );
      return;
    }

    const centerX = harknessCanvas.width / 2;
    const centerY = harknessCanvas.height / 2;
    const radius = 150;

    // Draw interaction lines
    interactionMap.forEach((interactionCount, key) => {
      const [index1, index2] = key.split('-').map(Number);
      const student1 = students[index1];
      const student2 = students[index2];

      harknessCtx.beginPath();
      harknessCtx.moveTo(student1.x, student1.y);
      harknessCtx.lineTo(student2.x, student2.y);
      harknessCtx.strokeStyle = 'green';
      harknessCtx.lineWidth = interactionCount; // Line width increases with interactions
      harknessCtx.stroke();
      harknessCtx.closePath();
    });

    // Draw student nodes
    students.forEach((student, index) => {
      const angle = (2 * Math.PI / students.length) * index;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      student.x = x;
      student.y = y;

      const isHovered = student === hoveredStudent;
      const nodeColor = isHovered ? '#005BB5' : '#0074D9';
      const nodeRadius = isHovered ? 25 : 20;

      harknessCtx.beginPath();
      harknessCtx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
      harknessCtx.fillStyle = nodeColor;
      harknessCtx.fill();
      harknessCtx.closePath();

      harknessCtx.fillStyle = '#000';
      harknessCtx.font = '14px Arial';
      harknessCtx.textAlign = 'center';
      harknessCtx.fillText(student.name, x, y + 35);
    });
  }

  // Update the bar chart
  function updateChart() {
    const labels = students.map(student => student.name);
    const questions = students.map(student => student.questions || 0);
    const insights = students.map(student => student.insights || 0);
    const interactions = students.map(student => student.interactions || 0);

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(studentChartCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Questions',
            data: questions,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
          {
            label: 'Insights',
            data: insights,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
          },
          {
            label: 'Interactions',
            data: interactions,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2, // Adjust chart height
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    });
  }

  // Add a new student
  addStudentBtn.addEventListener('click', () => {
    const studentName = prompt('Enter the name of the new student:');
    if (studentName && studentName.trim() !== '') {
      students.push({ name: studentName.trim(), questions: 0, insights: 0, interactions: 0 });
      updateChart();
      renderHarknessDiagram();
      alert(`${studentName} has been added.`);
    } else {
      alert('Invalid name. Please try again.');
    }
  });

  // Remove a student
  removeStudentBtn.addEventListener('click', () => {
    const studentName = prompt('Enter the name of the student to remove:');
    const studentIndex = students.findIndex(student => student.name.toLowerCase() === studentName.toLowerCase());
    if (studentIndex !== -1) {
      students.splice(studentIndex, 1);
      updateChart();
      renderHarknessDiagram();
      alert(`${studentName} has been removed.`);
    } else {
      alert(`Student named "${studentName}" not found.`);
    }
  });

  // Handle importing student list
  importStudentListBtn.addEventListener('click', () => {
    uploadFileInput.click();
  });

  uploadFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rows = event.target.result.split('\n');
        rows.forEach((row) => {
          const name = row.trim();
          if (name) {
            students.push({ name, questions: 0, insights: 0, interactions: 0 });
          }
        });
        updateChart();
        renderHarknessDiagram();
      };
      reader.readAsText(file);
    }
  });

  // Handle exporting student data
  exportDataBtn.addEventListener('click', () => {
    if (students.length === 0) {
      alert('No data available to export.');
      return;
    }

    const csvContent = [
      ['Student Name', 'Questions', 'Insights', 'Interactions'], // Header row
      ...students.map(student => [
        student.name,
        student.questions || 0,
        student.insights || 0,
        student.interactions || 0,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    if (confirm('Download Harkness Data?')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Harkness_Data.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  // Handle hover detection
  harknessCanvas.addEventListener('mousemove', (e) => {
    const rect = harknessCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundHover = false;
    students.forEach((student) => {
      const distance = Math.sqrt(
        (mouseX - student.x) ** 2 + (mouseY - student.y) ** 2
      );
      if (distance < 25) {
        hoveredStudent = student;
        foundHover = true;
      }
    });

    if (!foundHover) hoveredStudent = null;

    renderHarknessDiagram();
  });

  // Handle node click for dropdown menu
  harknessCanvas.addEventListener('click', (e) => {
    const rect = harknessCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clickedStudent = null;
    students.forEach((student) => {
      const distance = Math.sqrt(
        (mouseX - student.x) ** 2 + (mouseY - student.y) ** 2
      );
      if (distance < 25) {
        clickedStudent = student;
      }
    });

    if (clickedStudent) {
      hoveredStudent = clickedStudent;
      dropdownMenu.style.display = 'block';
      dropdownMenu.style.left = `${e.pageX}px`;
      dropdownMenu.style.top = `${e.pageY}px`;
    } else {
      dropdownMenu.style.display = 'none';
    }
  });

  // Dropdown menu button actions
  addQuestionBtn.addEventListener('click', () => {
    if (hoveredStudent) {
      hoveredStudent.questions = (hoveredStudent.questions || 0) + 1;
      updateChart();
      renderHarknessDiagram();
      dropdownMenu.style.display = 'none';
    }
  });

  addInsightBtn.addEventListener('click', () => {
    if (hoveredStudent) {
      hoveredStudent.insights = (hoveredStudent.insights || 0) + 1;
      updateChart();
      renderHarknessDiagram();
      dropdownMenu.style.display = 'none';
    }
  });

  addInteractionBtn.addEventListener('click', () => {
    if (hoveredStudent) {
      selectedStudentForInteraction = hoveredStudent;
      alert(`Please click on a student that ${hoveredStudent.name} interacted with.`);
      dropdownMenu.style.display = 'none';
    }
  });

  harknessCanvas.addEventListener('click', (e) => {
    if (selectedStudentForInteraction) {
      const rect = harknessCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let clickedStudent = null;
      students.forEach((student) => {
        const distance = Math.sqrt(
          (mouseX - student.x) ** 2 + (mouseY - student.y) ** 2
        );
        if (distance < 25) {
          clickedStudent = student;
        }
      });

      if (clickedStudent && clickedStudent !== selectedStudentForInteraction) {
        const firstIndex = students.indexOf(selectedStudentForInteraction);
        const secondIndex = students.indexOf(clickedStudent);

        const interactionKey =
          firstIndex < secondIndex
            ? `${firstIndex}-${secondIndex}`
            : `${secondIndex}-${firstIndex}`;

        const currentCount = interactionMap.get(interactionKey) || 0;
        interactionMap.set(interactionKey, currentCount + 1);

        clickedStudent.interactions = (clickedStudent.interactions || 0) + 1;
        selectedStudentForInteraction.interactions =
          (selectedStudentForInteraction.interactions || 0) + 1;

        updateChart();
        renderHarknessDiagram();
        dropdownMenu.style.display = 'none'; // Ensure dropdown menu is removed
        selectedStudentForInteraction = null;
      }
    }
  });

  // Initial render
  renderHarknessDiagram();
  updateChart();
});
