var file = null;

$(document).ready(function () {
    $("#loader").hide();

    $('#file-upload').bind('change', function () {
        var files = ""
        for (var i = 0; i < this.files.length; i++)
        {
            if(i !== this.files.length - 1)
                files += this.files[i].name +", "
            else
                files += this.files[i].name
        }
        $("#files-selected").html(files);
    })

    $(".user_message").each(function(idx, obj){
        let html = (obj.innerHTML);
        obj.innerHTML=("<pre>"+html+"</pre>");
    })

    let framework;
    var formData;
    $('#sendSocket').on('click', function(event) {
        event.preventDefault(); // avoid to execute the actual submit of the form.

        $("#loader").show();
        let userinput = $("#prompt").val();
        if(userinput === "")
        {
            userinput = "Please create metadata for a new case based on the information provided and return them in JSON!"
            $("#prompt").val(userinput)
        }

        let user_msg = '<div class="user_message"><pre>' + userinput + "</pre></div>"
        $("#chat").append(user_msg);

        let form = document.querySelector("#chatbox");
        formData = new FormData(form);

        let actionUrl = form.getAttribute('action');
        framework = $("#llm_framework").find(":selected").val();
        $("#prompt").val("");
        $.ajax({
            type: "POST",
            url: actionUrl,
            data: formData,
            contentType: false,
            processData: false,
            beforeSend: function() {
                let llm_msg = $("<div>", {"class": "llm_message"});
                llm_msg.html('<pre class="llm_pre">'+"</pre>");
                $("#chat").append(llm_msg)
                var fileInput = $('#file-upload');
                fileInput.replaceWith(fileInput.clone(true));
                $("#files-selected").html("");
            },
            success: function (data) {
                $("#loader").hide();
            },
            error: function (data){
                $("#loader").hide();
                alert("Error");
            }
        });
    });

    //WEBSOCKETS
    const socket = io();

    socket.on('connect', () => {
        console.log('Verbunden mit dem Server - ID '+ llm+'_stream'+chat_id);
    });


    let chat_id = $("input[name=chat_counter]").val();
    let llm = $("input[name=llm]").val();
    socket.on(llm+'_stream'+chat_id, (data) => {
        let messagesDiv = $(".llm_pre").last();
        if(data.content === "START_LLM_MESSAGE")
        {
            //Evtl um den Anfang zu erkennen
        }else
        if(data.content === "END_LLM_MESSAGE")
        {
            //Evtl um das Ende zu erkennen
        }else
        {
            if(framework === "llamaindex")
            {
                messagesDiv.html(data.content);
            }else if(framework === "langchain"){
                messagesDiv.append(data.content);
            }

        }

    });
});
