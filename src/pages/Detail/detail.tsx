import React, { Component } from "react";
import "./detail.less";
import { AxiosResponse } from "axios";
import {
  singleVideoData,
  getVideoComment,
  getInitVideoLikeData,
  postVideoLikeData,
  reportComment
} from "../../fetch/fetch";
import VideoDetail from "./components/VideoDetail";
import Pagination from "./components/Pagination";
import Loading from "../../common/Loading/Loading";
import { connect } from "react-redux";
import { showToast } from "../../store/action";
import { bindActionCreators, Dispatch } from "redux";
import Arrow from "../../common/Arrow/arrow";
import { IVideoDetail, IComment } from "../type";
interface IDetailProps {
  match: { params: { id: number } };
  showToast: Function;
  history: { push: Function; goBack: Function };
}
interface State {
  videoDetail: Array<Array<IVideoDetail>>;
  videoId: number;
  userName: string;
  iLike: string;
  commentVal: string;
  page: number;
  loadDone: boolean;
  pStart: number;
  pScroll: number;
  isPullDown: boolean;
  isStart: boolean;
  videoComment: Array<IComment>;
}
class Detail extends Component<IDetailProps, State> {
  constructor(props: IDetailProps) {
    super(props);

    this.state = {
      videoDetail: [],
      videoId: this.props.match.params.id,
      userName: localStorage.getItem("user") || "",
      iLike: "",
      commentVal: "",
      page: 1,
      loadDone: false,
      pStart: 0,
      pScroll: 0,
      isPullDown: false,
      isStart: false,
      videoComment: []
    };
    this.pullDownStart = this.pullDownStart.bind(this);
    this.pullDownMove = this.pullDownMove.bind(this);
    this.pullDownEnd = this.pullDownEnd.bind(this);
    this.handleSelLike = this.handleSelLike.bind(this);
    this.handleCommentInput = this.handleCommentInput.bind(this);
    this.postComment = this.postComment.bind(this);
    this.goPage = this.goPage.bind(this);
    this.nextPage = this.nextPage.bind(this);
    this.prevPage = this.prevPage.bind(this);
  }
  async componentDidMount() {
    let videoDetail: Array<Array<IVideoDetail>>;
    let { videoId, userName } = this.state;
    await singleVideoData(videoId).then(res => {
      videoDetail = res.data;
    });
    await getVideoComment(videoId).then(res => {
      this.setState({
        videoComment: res.data,
        videoDetail
      });
    });
    await getInitVideoLikeData(videoId, userName).then(res => {
      if (res.data[0]) {
        this.setState({
          iLike: res.data[0].iLike
        });
      }
    });
    setTimeout(() => {
      this.setState({
        loadDone: true
      });
    }, 500);
  }
  /**
   * 处理用户点击喜欢和不喜欢按钮
   * @param {*} type 用户点击类型 1为喜欢 2位不喜欢
   */
  handleSelLike(type: string) {
    let { videoId, videoDetail, userName } = this.state;
    let { name, star, img } = videoDetail && videoDetail[0][0];
    if (type === "needLogin") {
      this.props.showToast({
        icon: "fail",
        message: "请先登录！"
      });
      return;
    }
    postVideoLikeData(videoId, type, userName, name, img, star)
      .then(() => {
        this.props.showToast({
          message: "标记为" + (type === "1" ? "喜欢" : "不喜欢")
        });
        this.setState({
          iLike: type
        });
      })
      .catch(e => {
        this.props.showToast({
          icon: "fail",
          message: e.message
        });
        if (e.code === 404) {
          setTimeout(() => {
            localStorage.clear();
            this.props.history.push("/login");
          }, 1500);
        }
      });
  }
  /**
   * 监听评论框
   */
  handleCommentInput(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      commentVal: e.target.value
    });
  }
  /**
   * 用户评论点击
   */
  postComment() {
    let {
      commentVal,
      videoDetail,
      videoId,
      userName,
      videoComment
    } = this.state;
    let { name } = videoDetail && videoDetail[0][0];
    let avator = localStorage.getItem("avator") || "";
    if (commentVal.trim() === "") {
      this.props.showToast({
        icon: "fail",
        message: "请输入评论内容"
      });
      return;
    }
    reportComment(videoId, userName, commentVal, name, avator)
      .then(() => {
        this.props.showToast({
          message: "评论成功"
        });
        videoComment &&
          videoComment.push({
            id: +new Date(),
            userName,
            date: this.date("yyyy-MM-dd hh:mm:ss"),
            content: commentVal,
            avator
          });
        videoComment && this.goPage(Math.ceil(videoComment.length / 5));

        this.setState(prevState => ({
          videoComment,
          commentVal: ""
        }));

        var scrollHeight = document.documentElement.scrollHeight;
        window.scrollTo(0, scrollHeight);
      })
      .catch(e => {
        this.props.showToast({
          icon: "fail",
          message: e.message
        });
        if (e.code === 404) {
          setTimeout(() => {
            localStorage.clear();
            this.props.history.push("/login");
          }, 1500);
        }
      });
  }
  date(fmt: string){
    let date: Date = new Date();

    enum o {
      "M+" = date.getMonth() + 1, //月份
      "d+" = date.getDate(), //日
      "h+" = date.getHours(), //小时
      "m+" = date.getMinutes(), //分
      "s+" = date.getSeconds(), //秒
      "q+" = Math.floor((date.getMonth() + 3) / 3), //季度
      S = date.getMilliseconds() //毫秒
    }
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        (date.getFullYear() + "").substr(4 - RegExp.$1.length)
      );
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt)) {
        const val = o[k];
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? val : ("00" + val).substr(("" + val).length)
        );
      }
    return fmt;
  }
  goPage(page: number) {
    this.setState({
      page
    });
  }
  nextPage() {
    this.setState((prevState: { page: number }) => ({
      page: ++prevState.page
    }));
  }
  prevPage() {
    this.setState((prevState: { page: number }) => ({
      page: --prevState.page
    }));
  }
  pullDownStart(e: React.TouchEvent) {
    this.setState({
      pStart: e.touches[0].pageY,
      isStart: true
    });
  }
  pullDownMove(e: React.TouchEvent) {
    let pScroll = Math.ceil((e.touches[0].pageY - this.state.pStart) * 0.6);
    this.setState({
      pScroll
    });
  }
  pullDownEnd(e: React.TouchEvent) {
    let pScroll = this.state.pScroll;
    this.setState({
      pScroll: 0,
      isPullDown: true,
      isStart: false,
      loadDone: pScroll >= 50 ? false : true
    });
    if (pScroll >= 50) {
      this.componentDidMount();
    }
  }
  render() {
    let {
      iLike,
      videoDetail,
      videoComment,
      userName,
      page,
      commentVal,
      loadDone,
      isStart,
      pScroll
    } = this.state;
    return (
      <div
        className="pulldownWrap"
        onTouchStart={this.pullDownStart}
        onTouchMove={this.pullDownMove}
        onTouchEnd={this.pullDownEnd}
        style={{
          top: (pScroll > 0 ? pScroll : 0) + "px"
        }}
      >
        <div className="detail">
          <Arrow hidden={loadDone && isStart} rotate={pScroll} />
          <Loading loading={loadDone} />
          <VideoDetail
            selLike={this.handleSelLike}
            userName={userName}
            isLike={iLike}
            goBack={() => this.props.history.goBack()}
            detail={videoDetail}
            comments={videoComment}
            commentVal={commentVal}
            handleCommentInput={(e: React.ChangeEvent<HTMLInputElement>) =>
              this.handleCommentInput(e)
            }
            page={page}
            postComment={this.postComment}
          />
          <Pagination
            page={page}
            commentsPageLength={videoComment && videoComment.length}
            nextPage={this.nextPage}
            goPage={this.goPage}
            prevPage={this.prevPage}
          />
        </div>
        {/* <FixComment 
                        userName={userName}
                        commentVal={commentVal}
                        handleCommentInput={(e)=>(this.handleCommentInput(e))}
                /> */}
      </div>
    );
  }
}
interface IRecipeProps {
  toast: { isShow: Boolean; message: string; icon: string };
  showToast: Function;
}
function mapStateToProps(state: IRecipeProps) {
  return {
    toast: state.toast
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    showToast: bindActionCreators(showToast, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Detail);
