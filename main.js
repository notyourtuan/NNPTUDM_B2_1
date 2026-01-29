//HTTP request Get,post,put,delete
// Get max ID from posts
async function getMaxPostId() {
    try {
        let res = await fetch('http://localhost:3000/posts');
        let data = await res.json();
        if (data.length === 0) return 0;
        let maxId = Math.max(...data.map(p => parseInt(p.id) || 0));
        return maxId;
    } catch (error) {
        return 0;
    }
}

// Load posts (show soft deleted with strikethrough)
async function Load() {
    try {
        let res = await fetch('http://localhost:3000/posts')
        let data = await res.json();
        let body = document.getElementById("table-body");
        body.innerHTML = "";
        for (const post of data) {
            let strikethrough = post.isDeleted ? 'style="text-decoration: line-through;"' : '';
            body.innerHTML += `
            <tr>
                <td ${strikethrough}>${post.id}</td>
                <td ${strikethrough}>${post.title}</td>
                <td ${strikethrough}>${post.views}</td>
                <td><input value="Delete" type="submit" onclick="Delete(${post.id})" /></td>
                <td><input value="Comments" type="submit" onclick="LoadComments(${post.id})" /></td>
            </tr>`
        }
    } catch (error) {
        console.log(error);
    }
}

// Save post (auto increment ID for new posts)
async function Save() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("views_txt").value;
    let res;
    
    if (!title || !views) {
        alert("Please enter title and views");
        return;
    }
    
    // If no ID provided, generate new one
    if (!id) {
        let maxId = await getMaxPostId();
        id = (maxId + 1).toString();
    } else {
        id = id.toString();
    }
    
    let getID = await fetch('http://localhost:3000/posts/' + id);
    if (getID.ok) {
        // Update existing post
        res = await fetch('http://localhost:3000/posts/'+id, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {
                    id: id,
                    title: title,
                    views: views,
                    isDeleted: false
                }
            )
        })
    } else {
        // Create new post
        res = await fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {
                    id: id,
                    title: title,
                    views: views,
                    isDeleted: false
                }
            )
        })
    }
    if (res.ok) {
        console.log("them/sua thanh cong");
        document.getElementById("id_txt").value = "";
        document.getElementById("title_txt").value = "";
        document.getElementById("views_txt").value = "";
        Load();
    }
}

// Soft delete post
async function Delete(id) {
    let res = await fetch('http://localhost:3000/posts/' + id, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            isDeleted: true
        })
    });
    if (res.ok) {
        console.log("xoa thanh cong");
        Load();
    }
}

// ===== COMMENTS CRUD =====
// Load comments for a post
async function LoadComments(postId) {
    try {
        let res = await fetch('http://localhost:3000/comments?postId=' + postId);
        let comments = await res.json();
        let commentBody = document.getElementById("comments-body");
        
        if (!commentBody) {
            console.log("Comments section not found in HTML");
            return;
        }
        
        commentBody.innerHTML = `<h3>Comments for Post ${postId}</h3>`;
        
        for (const comment of comments) {
            let strikethrough = comment.isDeleted ? 'style="text-decoration: line-through;"' : '';
            commentBody.innerHTML += `
            <div class="comment-item" ${strikethrough}>
                <p><strong>ID: ${comment.id}</strong> - ${comment.text}</p>
                <button onclick="EditCommentShow(${comment.id}, '${comment.text.replace(/'/g, "\\'")}', ${postId})">Edit</button>
                <button onclick="DeleteComment(${comment.id})">Delete</button>
            </div>`;
        }
        
        // Add new comment form
        commentBody.innerHTML += `
        <div style="margin-top: 15px; border-top: 2px solid #ddd; padding-top: 10px;">
            <h4>Add New Comment</h4>
            <input type="text" id="new_comment_txt_${postId}" placeholder="Enter comment text" />
            <button onclick="SaveComment(${postId})">Add Comment</button>
            <button onclick="BackToPostList()">Back to Posts</button>
        </div>`;
    } catch (error) {
        console.log(error);
    }
}

// Back to posts list
function BackToPostList() {
    document.getElementById("comments-body").innerHTML = "";
    Load();
}

// Get max comment ID
async function getMaxCommentId() {
    try {
        let res = await fetch('http://localhost:3000/comments');
        let data = await res.json();
        if (data.length === 0) return 0;
        let maxId = Math.max(...data.map(c => parseInt(c.id) || 0));
        return maxId;
    } catch (error) {
        return 0;
    }
}

// Save comment (CREATE)
async function SaveComment(postId) {
    let text = document.getElementById(`new_comment_txt_${postId}`).value;
    if (!text) {
        alert("Please enter comment text");
        return;
    }
    
    let maxId = await getMaxCommentId();
    let newId = (maxId + 1).toString();
    
    let res = await fetch('http://localhost:3000/comments', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: newId,
            text: text,
            postId: postId.toString(),
            isDeleted: false
        })
    });
    
    if (res.ok) {
        console.log("comment saved");
        LoadComments(postId);
    }
}

// Show edit form for comment
function EditCommentShow(commentId, currentText, postId) {
    let newText = prompt("Edit comment:", currentText);
    if (newText !== null && newText !== "") {
        UpdateComment(commentId, newText, postId);
    }
}

// Update comment (UPDATE)
async function UpdateComment(commentId, text, postId) {
    let res = await fetch('http://localhost:3000/comments/' + commentId, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: commentId.toString(),
            text: text,
            postId: postId.toString(),
            isDeleted: false
        })
    });
    
    if (res.ok) {
        console.log("comment updated");
        LoadComments(postId);
    }
}

// Soft delete comment (DELETE)
async function DeleteComment(commentId) {
    // Get postId first
    try {
        let res = await fetch('http://localhost:3000/comments/' + commentId);
        let comment = await res.json();
        let postId = comment.postId;
        
        // Soft delete
        let deleteRes = await fetch('http://localhost:3000/comments/' + commentId, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                isDeleted: true
            })
        });
        
        if (deleteRes.ok) {
            console.log("comment deleted");
            LoadComments(postId);
        }
    } catch (error) {
        console.log(error);
    }
}

// Wait for DOM to be ready before loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Load);
} else {
    Load();
}
