document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  let status = 0;
  load_mailbox('inbox');

  document.querySelector('#compose-form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response =>  {
      status = response.status;
      return response.json();
    })
    .then(result=>  {
      if (status === 201)
        load_mailbox('sent');
    
      else {
        document.querySelector('#error').innerHTML = '';
        const error = document.createElement('div');
        error.className='alert alert-danger';
        error.innerHTML = result.error;
        document.querySelector('#error').append(error);
      }
    });

    return false;
  }


});
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())

  .then(data => {
    console.log(data);
    data.forEach(load_mail)
    })
  }

function load_mail(content) {
  const mailbox = document.querySelector('h3').innerHTML.charAt(0).toLowerCase() + document.querySelector('h3').innerHTML.slice(1);
  const div = document.createElement('div');
  div.className = 'mail';
  div.innerHTML = `<div> <p> <b>${content.recipients}</p> Subject: </b> ${content.subject}</div> <div class="timestamp">${content.timestamp}</div> `
  document.querySelector('#emails-view').append(div);
  if (content.read === true)
    div.style.backgroundColor = 'lightgray';
  else
    div.style.backgroundColor = 'white';

    div.onmouseover = function() {
      div.style.cursor= 'pointer';
    }
    div.onclick = function() {
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email').style.display = 'block';
      fetch(`/emails/${content.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })

      document.querySelector('#email').innerHTML = `<h2>${content.subject}</h2> <p style="font-size:12px">From:${content.sender}</p>  <p style="font-size:12px"> To:${content.recipients} </p> <p style="font-size:8px; color:gray;"> ${content.timestamp} <hr> </p>  <p> ${content.body} </p>`;
      if (mailbox === 'inbox')
        document.querySelector('#email').innerHTML += `<button style="display:inline-block; margin-top: 100px; margin-left:-50px;" class="btn btn-light btn-sm" id="archive">Archive</button>`;
      else if (mailbox === 'archive')
        document.querySelector('#email').innerHTML += `<button style="display:inline-block; margin-top: 100px; margin-left:-50px;" class="btn btn-light btn-sm" id="archive">Unarchive</button>`;

      document.querySelector('#email').innerHTML += `<button style="display:inline-block; margin-top: 100px; float:right;" class="btn btn-light btn-sm" id="reply">Reply</button>`;
     
      if (mailbox === 'inbox' || mailbox === 'archive')
        document.querySelector('#archive').onclick = function() {
          if (mailbox === 'inbox') {
            fetch(`/emails/${content.id}`, {
              method : 'PUT',
              body: JSON.stringify({
                archived : true
              })
            })
            document.querySelector('#archive').innerHTML = 'Unarchive';
          }
          else if (mailbox === 'archive') {
            fetch(`/emails/${content.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived : false
              })
            })
            document.querySelector('#archive').innerHTML = 'Archive';
          }
        }

      document.querySelector('#reply').onclick = function() {
        compose_email();
        document.querySelector('#compose-recipients').value = content.sender;
        if (document.querySelector('#compose-subject').value.toLowerCase().includes('re:'))
          document.querySelector('#compose-subject').value += content.subject;
        else
          document.querySelector('#compose-subject').value = `Re:${content.subject}`;
        document.querySelector('#compose-body').value = `On ${content.timestamp} ${content.sender} wrote: ${content.body}`;
      }
    }
}
