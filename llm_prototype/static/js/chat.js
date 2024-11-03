$(document).ready(function () {
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


    console.log("ready");
    $("form").submit(function (e) {
        e.preventDefault(); // avoid to execute the actual submit of the form.

        let userinput = $("#prompt").val();
        if(userinput === "")
        {
            $("#prompt").val("Please give me all data back and put them in JSON")
            userinput = "Please give me all data back and put them in JSON"
        }

        let user_msg = '<div class="user_message">' + userinput + "</div>"
        $("#chat").append(user_msg);


        let form = $(this);
        var formData = new FormData(this);
        let actionUrl = form.attr('action');
        $("#prompt").val("");
        $("")
        $.ajax({
            type: "POST",
            url: actionUrl,
            data: formData,
            contentType: false,
            processData: false,
            success: function (data) {
                let llm_msg = '<div class="llm_message">' + data + "</div>"
                $("#chat").append(llm_msg);
                var dateiInput = $('#file-upload');
                dateiInput.replaceWith(dateiInput.clone(true));
                $("#files-selected").html("");
            }
        });
    });
});