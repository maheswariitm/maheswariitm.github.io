document.addEventListener("DOMContentLoaded", function () {

  const container = document.getElementById("publications-container");
  const searchBox = document.getElementById("publicationSearch");
  const filterButtons = document.querySelectorAll(".filter-btn");

  let publications = [];
  let currentFilter = "all";


  // ------------------------------------------------
  // LOAD PUBLICATION DATA
  // ------------------------------------------------

  fetch("data/publication.json")
    .then(response => {

      if (!response.ok) {
        throw new Error("Unable to load publication.json");
      }

      return response.json();

    })
    .then(data => {

      publications = data;

      // Newest year first
      publications.sort((a, b) => b.year - a.year);

      renderPublications();

    })
    .catch(error => {

      console.error("Error loading publications:", error);

      container.innerHTML =
        "<p class='text-danger text-center'>" +
        "Unable to load publications." +
        "</p>";

    });


  // ------------------------------------------------
  // RENDER PUBLICATIONS
  // ------------------------------------------------

  function renderPublications() {

    const searchTerm =
      searchBox.value.toLowerCase().trim();


    // ------------------------------------------------
    // FILTER PUBLICATIONS
    // ------------------------------------------------

    let filtered = publications.filter(pub => {

      const matchesFilter =
        currentFilter === "all" ||
        pub.type === currentFilter;


      const searchableText =
        `${pub.authors || ""} ` +
        `${pub.title || ""} ` +
        `${pub.journal || ""} ` +
        `${pub.year || ""}`
        .toLowerCase();


      const matchesSearch =
        searchableText.includes(searchTerm);


      return matchesFilter && matchesSearch;

    });


    // ------------------------------------------------
    // CLEAR PREVIOUS CONTENT
    // ------------------------------------------------

    container.innerHTML = "";


    // ------------------------------------------------
    // NO RESULTS
    // ------------------------------------------------

    if (filtered.length === 0) {

      container.innerHTML =
        "<p class='text-center'>" +
        "No publications found." +
        "</p>";

      return;

    }


    // ------------------------------------------------
    // GROUP PUBLICATIONS BY YEAR
    // ------------------------------------------------

    const years = [
      ...new Set(
        filtered.map(pub => pub.year)
      )
    ];


    years.forEach(year => {

      const yearSection =
        document.createElement("div");

      yearSection.className =
        "publication-year";


      yearSection.innerHTML =
        `<h2 class="year-title">${year}</h2>`;


      // ------------------------------------------------
      // PUBLICATIONS FOR THIS YEAR
      // ------------------------------------------------

      filtered
        .filter(pub => pub.year === year)
        .forEach((pub, index) => {

          const card =
            document.createElement("div");

          card.className =
            "publication-card";


          // ------------------------------------------------
          // DOI / PDF LINKS
          // ------------------------------------------------

          let links = "";


          if (pub.doi) {

            links += `
              <a
                href="${pub.doi}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-sm btn-outline-primary mr-2">
                DOI
              </a>
            `;

          }


          if (pub.pdf) {

            links += `
              <a
                href="${pub.pdf}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-sm btn-outline-secondary">
                PDF
              </a>
            `;

          }


          // ------------------------------------------------
          // LATEST / NEW TAG
          // ------------------------------------------------
          //
          // The JSON file controls which publication
          // is marked as latest.
          //
          // Example:
          //
          // "latest": true
          //
          // Only publications with latest:true
          // will display the NEW tag.
          // ------------------------------------------------

          const latestTag =
            pub.latest === true
              ? `<span class="latest-tag">NEW</span>`
              : "";


          // ------------------------------------------------
          // PUBLICATION CARD
          // ------------------------------------------------

          card.innerHTML = `

            <div class="publication-number">
              ${index + 1}.
            </div>


            <div class="publication-content">

              <div class="publication-authors">
                ${pub.authors || ""}
              </div>


              <div class="publication-title">
                ${pub.title || ""}
                ${latestTag}
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


  // ------------------------------------------------
  // SEARCH
  // ------------------------------------------------

  searchBox.addEventListener(
    "input",
    renderPublications
  );


  // ------------------------------------------------
  // CATEGORY FILTERS
  // ------------------------------------------------

  filterButtons.forEach(button => {

    button.addEventListener("click", function () {


      // Reset all buttons
      filterButtons.forEach(btn => {

        btn.classList.remove("active");

        btn.classList.remove("btn-primary");

        btn.classList.add("btn-outline-primary");

      });


      // Activate clicked button
      this.classList.add("active");

      this.classList.remove("btn-outline-primary");

      this.classList.add("btn-primary");


      // Update filter
      currentFilter =
        this.dataset.filter;


      // Re-render
      renderPublications();

    });

  });

});