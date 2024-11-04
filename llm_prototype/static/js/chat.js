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


    console.log("ready");
    $('#send').on('click', function(event) {
        event.preventDefault(); // avoid to execute the actual submit of the form.

        $("#loader").show();
        let userinput = $("#prompt").val();
        if(userinput === "")
        {
            $("#prompt").val("Please give me all data back and put them in JSON")
            userinput = "Please give me all data back and put them in JSON"
        }

        let user_msg = '<div class="user_message">' + userinput + "</div>"
        $("#chat").append(user_msg);

        let form = document.querySelector("#chatbox");
        var formData = new FormData(form);
        let actionUrl = form.getAttribute('action');
        $("#prompt").val("");
        $("")
        $.ajax({
            type: "POST",
            url: actionUrl,
            data: formData,
            contentType: false,
            processData: false,
            success: function (data) {
                $("#loader").hide();
                let llm_msg = '<div class="llm_message">' + data + "</div>"
                $("#chat").append(llm_msg);
                var dateiInput = $('#file-upload');
                dateiInput.replaceWith(dateiInput.clone(true));
                $("#files-selected").html("");
            },
            error: function (data){
                $("#loader").hide();
                alert("Error");
            }
        });
    });

    $('#sendSocket').on('click', function(event) {
        event.preventDefault(); // avoid to execute the actual submit of the form.

        $("#loader").show();
        let userinput = $("#prompt").val();
        if(userinput === "")
        {
            $("#prompt").val("Please give me all data back and put them in JSON")
            userinput = "Please give me all data back and put them in JSON"
        }

        let user_msg = '<div class="user_message">' + userinput + "</div>"
        $("#chat").append(user_msg);

        let form = document.querySelector("#chatbox");
        var formData = new FormData(form);
        let actionUrl = form.getAttribute('action')+"socket";
        $("#prompt").val("");
        $.ajax({
            type: "POST",
            url: actionUrl,
            data: formData,
            contentType: false,
            processData: false,
            beforeSend: function() {
                let llm_msg = $("<div>", {"class": "llm_message"});
                $("#chat").append(llm_msg)
                var dateiInput = $('#file-upload');
                dateiInput.replaceWith(dateiInput.clone(true));
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


    const socket = io();

    socket.on('connect', () => {
        console.log('Verbunden mit dem Server');
    });

    let chat_id = $("input[name=chat_counter]").val();
    let llm = $("input[name=llm]").val();

    socket.on(llm+'_stream'+chat_id, (data) => {
        let messagesDiv = $(".llm_message").last();
        console.log(data.content)
        if(data.content === "START_LLM_MESSAGE")
        {
            messagesDiv.append("<pre>");
        }else
        if(data.content === "END_LLM_MESSAGE")
        {
            let output = messagesDiv.html();
            let new_output = "<pre>"+output+"</pre>";
            messagesDiv.html(new_output);
        }else
        {
            messagesDiv.append(data.content);
        }

    });
});


function wrapJsonInPreTags(inputString) {
    console.log(inputString)
    // Suche nach möglichen JSON-Substring-Mustern
    const jsonPattern = /\{([^}]+)\}/
    const matches = inputString.match(jsonPattern);

    if (matches) {
        // Gehe durch alle gefundenen Übereinstimmungen
        matches.forEach(match => {
            try {
                // Versuche, das Substring als JSON zu parsen
                JSON.parse(match);
                // Wenn das Parsen erfolgreich war, umschließe es mit <pre>-Tags
                const wrappedJson = `<pre>${match}</pre>`;
                inputString = inputString.replace(match, wrappedJson);
            } catch (e) {
                console.log(e)
            }
        });
    }

    return inputString; // Gibt den modifizierten String zurück
}

// Beispiel
const text = "Hier ist ein Beispiel-Text mit JSON: {'name': 'John', 'age': 30} und mehr Text.";
const result = wrapJsonInPreTags(text);
console.log(result);