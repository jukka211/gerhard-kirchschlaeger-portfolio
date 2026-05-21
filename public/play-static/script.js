



// ------------------
       
 






// ------------------
        const fontFamilies = [
        'Freizeit',
        'Freizeit140'
        
        ];

        // Function to get a random font from the list
        function getRandomFont() {
            return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
        }

        // Function to change font family for each letter randomly
        function changeFontFamilyRandomly() {
            document.querySelectorAll('.title span').forEach(span => {
                span.style.fontFamily = getRandomFont();
            });
        }

        // Event listener for mouse wheel scroll to change font family randomly
        document.addEventListener('wheel', function() {
            changeFontFamilyRandomly();
        });

        // Initial font set up to apply random fonts
        changeFontFamilyRandomly();









// ------------------
    // Track the element being dragged and the initial positions
    let draggedElement = null;
    let initialX, initialY;
    let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Function to handle scaling and shifting subsequent elements on Y-axis (for mobile)
    function scaleElementAndShiftDivs(deltaY) {
        const scaleY = Math.max(1 + deltaY / 100, 1); // Ensure scaling doesn't go below 1 (no shrink)
        
        // Apply the Y-axis scale to the dragged element
        draggedElement.style.transformOrigin = 'top'; // Fix the origin to the top
        draggedElement.style.transform = `scaleY(${scaleY})`;
        draggedElement.style.marginBottom = '0px'; // No margin applied

        // Calculate how much space is needed for subsequent divs
        const shiftAmount = (scaleY - 1) * draggedElement.offsetHeight + deltaY / 2;

        // Shift all the divs below the dragged element
        const allDivs = document.querySelectorAll('.title'); // Assuming each div with spans has class 'title'
        let shiftNext = false; // Flag to track when to start shifting subsequent divs
        allDivs.forEach(div => {
            if (shiftNext) {
                div.style.transform = `translateY(${shiftAmount}px)`; // Shift subsequent divs downward
            }
            if (div === draggedElement.closest('.title')) {
                shiftNext = true; // Start shifting after the dragged element's parent div
            }
        });
    }

   // Function to handle scaling on X-axis (for desktop)
function scaleElementAndShiftLetters(deltaX) {
    const scaleX = Math.max(1 + deltaX / 100, 1); // Ensure scaling doesn't go below 1 (no shrink)

    // Apply the X-axis scale to the dragged element
    draggedElement.style.transformOrigin = 'left'; // Fix the origin to the left
    draggedElement.style.transform = `scaleX(${scaleX})`;

    // Remove margin to the right of the scaled letter
    draggedElement.style.marginRight = '0px'; // No margin applied

    // Calculate how much space is needed for subsequent letters
    const shiftAmount = (scaleX - 1) * draggedElement.offsetWidth + deltaX / 16;

    // Shift the subsequent letters to the right
    let nextElement = draggedElement.nextElementSibling;
    while (nextElement) {
        nextElement.style.transform = `translateX(${shiftAmount}px)`;
        nextElement = nextElement.nextElementSibling;
    }
}

// Mobile (Touch) Events
if (isTouchDevice) {
    document.querySelectorAll('.title span').forEach(span => {
        span.addEventListener('touchstart', function(event) {
            draggedElement = this; // Get the individual letter being dragged
            initialX = event.touches[0].clientX; // Store the initial X position when touch starts
            initialY = event.touches[0].clientY; // Store the initial Y position when touch starts
            event.preventDefault(); // Prevent default touch behavior
        });
    });

    document.addEventListener('touchmove', function(event) {
        if (draggedElement) {
            const currentX = event.touches[0].clientX;
            const currentY = event.touches[0].clientY;
            const deltaX = currentX - initialX; // Calculate the movement on the X-axis
            const deltaY = currentY - initialY; // Calculate the movement on the Y-axis

            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                // If vertical movement is greater, scale and shift vertically (for mobile)
                scaleElementAndShiftDivs(deltaY);
            } else {
                // If horizontal movement is greater, scale and shift horizontally (for desktop-like behavior)
                scaleElementAndShiftLetters(deltaX);
            }
        }
    });

    document.addEventListener('touchend', function() {
        // Reset the transform and margins after dragging
        document.querySelectorAll('.title span').forEach(span => {
            span.style.transform = '';
            span.style.marginRight = '';
        });
        draggedElement = null; // Reset dragged element on touch end
    });
}

    // Desktop (Mouse) Events
    if (!isTouchDevice) {
        document.querySelectorAll('.title span').forEach(span => {
            span.addEventListener('mousedown', function(event) {
                draggedElement = this; // Get the individual letter being dragged
                initialX = event.clientX; // Store the initial X position when the mouse is pressed down
                event.preventDefault(); // Prevent text selection while dragging
            });
        });

        document.addEventListener('mousemove', function(event) {
            if (draggedElement) {
                const deltaX = event.clientX - initialX; // Calculate the movement on the X-axis
                scaleElementAndShiftLetters(deltaX); // Call the function to scale the letter and shift subsequent letters
            }
        });

        document.addEventListener('mouseup', function() {
            // Reset the transform and margins after dragging
            document.querySelectorAll('.title span').forEach(span => {
                span.style.transform = '';
                span.style.marginRight = '';
            });
            draggedElement = null; // Reset dragged element on mouse up
        });
    }

   
//-----------------------
