$(document).ready(function(){
    $.ajax(
        {
            url:"http://api.tasklist.dev/task",
            dataType: "json",
            type : 'GET',
            success:function(result){
                jQuery.each(result.data, function(index, task) {
                    addTaskRow(task.id,task.name,task.difficulty);
                });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        }
    );
});

function addTaskRow(id, name, difficulty){
    $('#task-container').append(
        id + ' :: ' + name + ' :: ' + difficulty + '<hr>'
    )
}