$(function() {

    // あるイベントeventとその参加者membersを整形したhtmlを返す
    var createEvent = function(event, members) {

        /* メンバー部分 */
        var members_html = ""
        if( members != []) {
            members_html += "<ul class='members clearfix'>";
            members.forEach(function(member) {
                members_html += ["<li data-cid='", member.id, "' class='", member.sex ,"'>", member.name, "<span>", member.grade, "</span></li>"].join('');
            });
            members_html += "</ul><div class='clearfix'></div>";
        }

        /* フォーム部分 */
        var form_html = (function() {/*
<div id="joinField" style="display:none;">
<form class="form-horizontal" role="form" id="join" method="post">
    <div class="form-group">
        <label for="joinName" class="col-sm-2 control-label">
            名前
        </label>
        <div class="col-sm-10">
            <input type="text" name="joinName" value="" id="joinName" class="form-control" placeholder="名前を入力">
        </div>
    </div>
    <div class="form-group">
        <label for="joinGrade" class="col-sm-2 control-label">
            学年
        </label>
        <div class="col-sm-10">
            <select class="joinGrade" name="joinGrade" id="joinGrade">
                <option value="">学年を選択してください</option>
                <option value="1年">学部１年</option>
                <option value="2年">学部２年</option>
                <option value="3年">学部３年</option>
                <option value="4年">学部４年</option>
                <option value="M1">修士１年</option>
                <option value="M2">修士２年</option>
                <option value="社会人">社会人</option>
            </select>
        </div>
    </div>
    <div class="form-group text-center">
        <label class="radio-inline"><input type="radio" name="joinSex" id="joinSex" value="female">女性</label>
        <label class="radio-inline"><input type="radio" name="joinSex" id="joinSex" value="male">男性</label>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-2 col-sm-10">
        <p>
            <button type="submit" id="create-btn" class="btn btn-default">
                登録
            </button>
            <button type="button" class="close btn btn-default">
            x
            </button>
        </p>
        </div>
    </div>
</form>
</div>
            */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

            var reg = new RegExp(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);
            var date = (event.date).match(reg);
            var year = date[1]
            ,   month = date[2]
            ,   day = date[3]
            ,   hour = date[4]
            ,   min = date[5];

            /* イベント本体部分 */
            var html = ["<h2>", event.name, "</h2>", "<span class='date'>", month + "/" + day, 
                        "</span>", "<table>", "<tr><th width='100'>集合場所</th>", "<td>" + event.place + "</td></tr>",
                        "<tr><th>集合時間</th>", "<td>" + hour + ":" + min + "</td></tr>",
                        "<tr><th>値段</th>", "<td>" + event.price + "円</td></tr>",
                        "<tr><th>幹事</th>", "<td>" + event.leader + "</td></tr></table>",
                        "<p>参加者： <span class='badge'>", event.number, "</span></p>",
                        members_html, "<button type='button' id='join-btn' class='btn btn-default center-block'>参加する</button>",
                        form_html].join('');

            $event = $("<li>", {
                addClass: 'col-sm-12 col-md-8 col-lg-7 event center-block',
                id: 'event',
                style: "display: none;",
                html: html
            });
            $event.attr('data-id', event.id);
            return $event;
    }


    var milkcocoa = new MilkCocoa('hotii8g93qv.mlkcca.com');
    var ds = milkcocoa.dataStore('events');
    var events = ds.history().sort('desc');

    events.size(100);
    events.limit(999);

    events.on('data', function(data) {
        data.forEach(function(datum) {
            var d = {
                id: datum.id,
                name: datum.value.name,
                date: datum.value.date,
                place: datum.value.place,
                description: datum.value.description,
                price: datum.value.price,
                leader: datum.value.leader,
                number: 0
            };
            console.log(d);

            var child = ds.child(d.id).history();
            child.size(100);
            child.limit(999);

            var members = []

            child.on('data', function(cdata) {
                cdata.forEach(function(cdatum) {
                    d.number += 1;
                    cd = {
                        id: cdatum.id,
                        name: cdatum.value.name,
                        grade: cdatum.value.grade,
                        sex: cdatum.value.sex
                    };
                    members.push(cd);
                });
            });

            child.on('end', function( ) {
                console.log(members);
                $event = createEvent(d, members);
                $('ul#events div.row').append($event);
                $event.fadeIn('normal');
            });
            child.run();
        });
    });

    events.on('end', function() {
    });

    events.on('error', function(err) {
        console.log(err);
    });

    events.run();



    $(document).on('click', '#create-btn', function() {
        var ok = $('#join').valid();
        if( !ok ) return false; // 何故かバリデーション聞かない

        var $parent = $(this).parents("form#join");

        var name = $parent.find("#joinName").val()
        ,   grade = $parent.find("#joinGrade").val()
        ,   sex = $parent.find("input[name='joinSex']:checked").val();

        var msg = [];
        if(!name) msg.push("名前");
        if(!grade) msg.push("学年");
        if(!sex) msg.push("性別");

        if( msg.length != 0 ) {
            msg = msg.join("・") + "を入力してください";
            alert(msg);
            return false;
        }

        var jData = {
            name: name,
            grade: grade,
            sex: sex
        };
        var id = $(this).parents('li').attr('data-id');
        var child = ds.child(id);
        child.push(jData, function(err, pushed) {
            console.log(pushed);
            alert('イベントが参加しました。リロードしてください');
            $('#joinField').fadeOut('normal');

            $('#joinName').val('');
            $('#joinGrade').val('');
            $('#joinSex').val('');
            location.reload();
        },
        function(err) {
            console.log(err);
            alert('参加できませんでした。');
        });
        $('#join-btn').fadeIn('normal');

        return false;
    });

    $(document).on('click', '#join-btn', function() {
        $(this).next('#joinField').fadeIn('normal');
        $(this).hide();
        return false;
    });

    $(document).on('click', '.close', function() {
        $(this).parents('form').fadeOut('normal');
        return false;
    });

    $('#event-btn').click(function() {
        $('#createEvent').toggle('normal');
        return false;
    });

    $('#create').click(function() {
        var ok = $('#form').valid();
        if( !ok ) return false; 

        var eName = $('#eventName').val();
        var eDate = $('#eventDate').val();
        var ePlace = $('#eventPlace').val();
        var ePrice = $('#eventPrice').val();
        var eDeadline = $('#eventDeadline').val();
        var eDescription = $('#eventDescription').val();
        var eLeader = $('#eventLeader').val();

        var eData = {
            name: eName,
            date: eDate,
            place: ePlace,
            price: ePrice,
            deadline: eDeadline,
            description: eDescription,
            leader: eLeader
        };
        ds.push(eData, function(err, pushed){
            console.log(pushed);
            alert('イベントが作成されました。');
            $('#createEvent').fadeOut('normal');

            $('#eventName').val('');
            $('#eventDate').val('');
            $('#eventPlace').val('');
            $('#eventPrice').val('');
            $('#eventDescription').val('');
            $('#eventLeader').val('');

            location.reload();
            // ここでイベントをリロードする。
        }, function(err) {
            console.log(err);
            alert('イベントが登録できませんでした。');
        });

        return false;
    });

    $("#eventDate").datetimepicker({format: 'yyyy-mm-dd hh:ii'});
    $("#eventDeadline").datetimepicker({format: 'yyyy-mm-dd hh:ii'});


    $('#join').validate( {
        rules: {
            joinName: {
                required: true
            },
            joinGrade: {
                required: true
            },
            joinSex: {
                required: true
            }
        },
        messages: {
            joinName: {
                required: '名前を入力してください'
            },
            joinGrade: {
                required: '学年を入力してください'
            },
            joinSex: {
                required: '性別を選択してください'
            }
        }
    });

    $('#form').validate( {
        rules: {
            eventName: {
                required: true
            },
            eventDate: {
                required: true
            },
            eventPlace: {
                required: true
            },
            eventPrice: {
                required: true
            },
            eventDeadline: {
                required: true
            },
            eventLeader: {
                required: true
            }
        },
        messages: {
            eventName: {
                required: 'イベント名を入力してください'
            },
            eventDate: {
                required: 'イベント日時を入力してください'
            },
            eventPlace: {
                required: 'イベント場所を指定してください(未定可)'
            },
            eventPrice: {
                required: '料金を入力してください'
            },
            eventDeadline: {
                required: '締め切りを決めてください'
            },
            eventLeader: {
                required: '幹事名を入力してください'
            }    
        }
    });


});