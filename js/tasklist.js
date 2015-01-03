$(document).ready(function(){
    reloadAll();

    $('#show-add-task-button').click(function(){
        showInputBox();
    });

    $('body').on('click', '#add-task',function(event){
        event.preventDefault();
        createTask();
    });

    $('body').on('click', '.task.row',function(event){
        replaceRowWithForm($(this));
    });

    // only reload if focus is not on child element in form
    $('#task-container').on('focusout', '#edit-task-form', function(event){
        setTimeout(function() {
            if (!event.delegateTarget.contains(document.activeElement)) {
                reloadAll();
            }
        }, 0);
    });
});

function reloadAll(){
    $('#task-container').html('');
    $.ajax(
        {
            url:"http://api.tasklist.dev/task/",
            dataType: "json",
            type : 'GET',
            success:function(result){
                if (result.data) {
                    after = null;
                    $.each(result.data, function (index, task) {
                        insertTaskRow(task.id, task.name, task.difficulty, after);
                        after = 'task-row-' + task.id;
                    });
                } else {
                    $('#task-container').html('No tasks');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}

function replaceRowWithForm($row){
    if (! $('#edit-task-form').length ) {
        var oldName = $row.html();
        $.get('/elements/edit_task_form.html', function (data) {
            data = data.replace('{{ task.name }}', oldName);
            $row.html(data);
            //$('#edit-task-form #new-task-name').focus();
        });
    }
}

function insertTaskRow(taskId, taskName, taskDifficulty, after){
    var row = '<div id = "task-row-{{ task.id }}" class = "row task {{ task.difficulty }}">{{ task.name }}</div>';

    row = row.replace('{{ task.id }}', taskId);
    row = row.replace('{{ task.name }}', taskName);
    row = row.replace('{{ task.difficulty }}', getDifficultyClass(taskDifficulty));
    if (after !==  null) {
        $('#' + after).after(row);
    } else {
        $('#task-container').append(row);
    }
}

function showInputBox(){
    if (! $('#add-task-form').length ) {
        $.get('/elements/add_task_form.html', function (data) {
            $('body').append(data);
        });
    }
}

function getDifficultyClass(difficulty){
    switch (difficulty){
        case 1: return 'green';
        case 2: return 'blue';
        case 3: return 'red';
    }
}

function createTask(){
    var taskName = $('#add-task-form #new-task-name').val();
    var difficulty = $('#add-task-form #new-task-difficulty').find(":selected").text();
    $.ajax(
        {
            url:"http://api.tasklist.dev/task/",
            dataType: "json",
            crossDomain: true,
            processData: false,
            type : 'POST',
            data: '{"name":"' + taskName + '", "difficulty":"' + difficulty + '"}',
            success:function(result){
                reloadAll();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        }
    );
}