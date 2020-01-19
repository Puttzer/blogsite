const posts = document.querySelectorAll(".user-post");
for (let post of posts) {
  const editBtn = post.querySelector(".edit-btn");
  editBtn.addEventListener("click", () => {
    post.querySelector(".edit-post").classList.toggle("hidden");
    post.querySelector(".content").classList.toggle("hidden");
  });
}
