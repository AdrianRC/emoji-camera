// https://docs.cypress.io/api/introduction/api.html

describe("Camera", () => {
  it("Video elements are visible", () => {
    cy.visit("/");
    cy.get("select").should("be.visible");
    cy.get("video").should("be.visible");
  });
});
