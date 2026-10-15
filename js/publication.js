document.addEventListener("DOMContentLoaded", function () {

  const container = document.getElementById("publications-container");
  const searchBox = document.getElementById("publicationSearch");
  const filterButtons = document.querySelectorAll(".filter-btn");

  let publications = [];
  let currentFilter = "all";


  // Load publication data
  fetch("data/publication.json")
    .then(response => response.json())
    .then(data => {

      publications = data;

      // Newest first
      publications.sort((a, b) => b.year - a.year);

      renderPublications();

    })
    .catch(error => {

      console.error("Error loading publications:", error);

      container.innerHTML =
        "<p class='text-danger text-center'>Unable to load publications.</p>";

    });


  function renderPublications() {

    const searchTerm =
      searchBox.value.toLowerCase().trim();


    let filtered = publications.filter(pub => {

      const matchesFilter =
        currentFilter === "all" ||
        pub.type === currentFilter;

      const searchableText =
        `${pub.authors} ${pub.title} ${pub.journal} ${pub.year}`
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(searchTerm);

      return matchesFilter && matchesSearch;

    });


    container.innerHTML = "";


    if (filtered.length === 0) {

      container.innerHTML =
        "<p class='text-center'>No publications found.</p>";

      return;

    }


    // Group by year
    const years = [...new Set(filtered.map(pub => pub.year))];


    years.forEach(year => {

      const yearSection =
        document.createElement("div");

      yearSection.className = "publication-year";


      yearSection.innerHTML =
        `<h2 class="year-title">${year}</h2>`;


      filtered
        .filter(pub => pub.year === year)
        .forEach((pub, index) => {

          const card =
            document.createElement("div");

          card.className = "publication-card";


          let links = "";


          if (pub.doi) {

            links += `
              <a href="${pub.doi}"
                 target="_blank"
                 class="btn btn-sm btn-outline-primary mr-2">
                 DOI
              </a>
            `;

          }


          if (pub.pdf) {

            links += `
              <a href="${pub.pdf}"
                 target="_blank"
                 class="btn btn-sm btn-outline-secondary">
                 PDF
              </a>
            `;

          }


          card.innerHTML = `

            <div class="publication-number">
              ${index + 1}.
            </div>

            <div class="publication-content">

              <div class="publication-authors">
                ${pub.authors}
              </div>

              <div class="publication-title">
                ${pub.title}
              </div>

              <div class="publication-journal">
                ${pub.journal || ""}
              </div>

              <div class="publication-links mt-3">
                ${links}
              </div>

            </div>

          `;


          yearSection.appendChild(card);

        });


      container.appendChild(yearSection);

    });

  }


  // Search
  searchBox.addEventListener(
    "input",
    renderPublications
  );


  // Filters
  filterButtons.forEach(button => {

    button.addEventListener("click", function () {

      filterButtons.forEach(btn => {

        btn.classList.remove("active");
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-outline-primary");

      });


      this.classList.add("active");
      this.classList.remove("btn-outline-primary");
      this.classList.add("btn-primary");


      currentFilter =
        this.dataset.filter;


      renderPublications();

    });

  });

});